import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Copy, Check, Volume2, VolumeX, ThumbsUp, ThumbsDown, Code2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage as ChatMessageType } from '../types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

const LANG_REGEX = /^(python|javascript|js|typescript|ts|html|css|json|sql|bash|cpp|c|java|go|rust|php|ruby)\s+/i;
const CODE_KEYWORDS_REGEX = /(def\s+\w+|function\s+\w+|const\s+\w+|let\s+\w+|class\s+\w+|import\s+.*from|return\s+.*|print\(|console\.log\()/;

// Preprocess raw text from webhook: unescape \n, split squished inline/mid-sentence lists into block lists, and handle raw code outputs
const preprocessMarkdownText = (rawText: string): string => {
  if (!rawText) return '';

  // 1. Unescape literal \n strings if present in webhook output
  let text = rawText.replace(/\\n/g, '\n');

  // 2. Process text outside of code blocks to prevent breaking code contents
  const codeBlockParts = text.split(/(```[\s\S]*?```)/g);

  const processedParts = codeBlockParts.map((part, index) => {
    // Skip processing inside code blocks (odd indices in split result)
    if (index % 2 === 1) return part;

    let cleanPart = part;

    // A. Replace bullet symbols (•) appearing mid-sentence or inline with double newlines and markdown dash bullets
    cleanPart = cleanPart.replace(/([^\n])\s*•\s*/g, '$1\n\n- ');
    cleanPart = cleanPart.replace(/^•\s*/gm, '- ');

    // B. Insert double newlines before numbered lists (e.g., '1. ', '2. ', '1) ', '2) ') if mid-sentence or after single newline
    cleanPart = cleanPart.replace(/([^\n])\s+(\d+[\.\)]\s+[A-Za-z0-9"'\`\[])/g, '$1\n\n$2');
    cleanPart = cleanPart.replace(/([^\n])\n(\d+[\.\)]\s+[A-Za-z0-9"'\`\[])/g, '$1\n\n$2');

    // C. Insert double newlines before inline dashes (' - ') used as list separators
    cleanPart = cleanPart.replace(/([^\n])\s+-\s+([A-Za-z0-9"'\`\[])/g, '$1\n\n- $2');
    cleanPart = cleanPart.replace(/([^\n])\n(-\s+[A-Za-z0-9"'\`\[])/g, '$1\n\n$2');

    // D. Insert double newlines before inline asterisk bullets (' * ')
    cleanPart = cleanPart.replace(/([^\n])\s+\*\s+([A-Za-z0-9"'\`\[])/g, '$1\n\n* $2');

    // E. Ensure a double newline precedes any list block starting right after text
    cleanPart = cleanPart.replace(/([^\n])\n([•\-\*]\s+|\d+[\.\)]\s+)/g, '$1\n\n$2');

    return cleanPart;
  });

  text = processedParts.join('');

  // 3. If response text lacks triple-backticks but contains unformatted code constructs or language prefix
  const trimmed = text.trim();
  if (!text.includes('```') && (LANG_REGEX.test(trimmed) || CODE_KEYWORDS_REGEX.test(trimmed))) {
    const langMatch = trimmed.match(LANG_REGEX);
    const lang = langMatch ? langMatch[1] : '';
    const cleanCode = langMatch ? trimmed.slice(langMatch[0].length) : trimmed;
    return `\n\`\`\`${lang}\n${cleanCode}\n\`\`\`\n`;
  }

  return text;
};

// ChatGPT-Quality Dynamic Code Beautifier & Indentation Engine
const formatCodeText = (code: string): string => {
  if (!code) return '';

  let raw = code.replace(/\\n/g, '\n').trim();

  // Step 1: Separate code keywords and definitions smashed onto comment lines
  // e.g. "... function to add two numbers def add_numbers(a, b):" -> "... function to add two numbers\ndef add_numbers(a, b):"
  raw = raw.replace(/([#\/\/].*?)\s+(?=(\bdef\b|\bclass\b|\bfunction\b|\bconst\b|\blet\b|\bvar\b|\breturn\b|\bprint\(|\bconsole\.log\(|\b[a-zA-Z_]\w*\s*=))/g, '$1\n');

  // Step 2: Separate inline return statements & code following comments
  // e.g. "return the result return a + b" -> "return the result\nreturn a + b"
  // e.g. "return a + b # Example usage" -> "return a + b\n# Example usage"
  raw = raw.replace(/(return\s+[^#\n;]+?)\s+(?=(return\b|print\(|console\.log\(|#|\/\/|\b[a-zA-Z_]\w*\s*=|\bdef\b|\bclass\b))/g, '$1\n');

  // Step 3: Separate variable assignments smashed together
  // e.g. "num1 = 5 # Assign the first number num2 = 7" -> "num1 = 5\n# Assign the first number\nnum2 = 7"
  raw = raw.replace(/([#\/\/].*?)\s+(?=\b[a-zA-Z_]\w*\s*=)/g, '$1\n');
  raw = raw.replace(/(\b[a-zA-Z_]\w*\s*=\s*(?:'[^']*'|"[^"]*"|\d+|\b\w+\([^)]*\)|\b\w+))\s+(?=[a-zA-Z_]\w*\s*=|#|\/\/|print\(|console\.log\()/g, '$1\n');

  // Step 4: Rejoin comment lines split mid-sentence across newlines (e.g., "# Define a\nfunction to add two numbers")
  raw = raw.replace(/([#\/\/]\s*[A-Z][a-z0-9\s]*?)\n([a-z][a-z0-9\s,]+?)(?=\s+def\b|\s+return\b|\s+#|\s+\/\/|\n|$)/gi, (match, p1, p2) => {
    if (!CODE_KEYWORDS_REGEX.test(p2) && !p2.includes('=')) {
      return `${p1} ${p2.trim()}`;
    }
    return match;
  });

  // Step 5: Build dynamic indentation for Python and JavaScript blocks
  const rawLines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const resultLines: string[] = [];
  let indent = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Dedent for closing braces or else/elif/except
    if (/^(\}|\]|\)|else:|elif\b|except\b|finally:)/.test(line)) {
      indent = Math.max(0, indent - 1);
    }

    // Apply 4-space indentation per level
    const paddedLine = '    '.repeat(indent) + line;
    resultLines.push(paddedLine);

    // Increase indent after block headers (ending in ':' or '{')
    if (
      /:\s*$/.test(line) ||
      /:\s*(#|\/\/)/.test(line) ||
      /\{\s*$/.test(line) ||
      /^\s*(def|class|function|if|for|while|try|except|else|elif|with)\b/.test(line)
    ) {
      if (!/:\s*return\b/.test(line) && !/;\s*$/.test(line) && !/\{\s*\}/.test(line)) {
        indent++;
      }
    }

    // Reset indent after return statement at top level
    if (/^\s*return\b/.test(line) && indent > 0 && i < rawLines.length - 1 && /^(#|\/\/|[a-zA-Z_]\w*\s*=)/.test(rawLines[i + 1])) {
      indent = Math.max(0, indent - 1);
    }
  }

  return resultLines.join('\n');
};

// Custom CodeBlock Component with Language Tag & Copy Code Button
const CodeBlock: React.FC<{ language?: string; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const formattedCode = formatCodeText(value);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(formattedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3.5 rounded-2xl overflow-hidden bg-[#090d16] border border-white/15 shadow-xl max-w-full w-full">
      {/* Code Block Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-white/10 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="uppercase font-bold tracking-wider text-slate-300">
            {language || 'code'}
          </span>
        </div>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-sans font-medium text-[10px]">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="font-sans font-medium text-[10px]">Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content Area - Always wraps lines cleanly with whitespace-pre-wrap & break-words */}
      <pre className="p-4 text-xs sm:text-[13px] font-mono leading-relaxed text-indigo-200 scrollbar-thin max-w-full whitespace-pre-wrap break-words overflow-x-auto">
        <code>{formattedCode}</code>
      </pre>
    </div>
  );
};

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  const processedText = preprocessMarkdownText(message.text);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (speaking) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
      } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message.text);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setSpeaking(true);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        type: 'spring',
        stiffness: 400,
        damping: 30,
        mass: 0.8
      }}
      className={`flex items-start gap-2.5 sm:gap-3 my-3.5 max-w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md ${
        isUser 
          ? 'bg-gradient-to-tr from-purple-500 to-indigo-500 text-white shadow-purple-500/20' 
          : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-indigo-200 p-0.5 shadow-indigo-500/20'
      }`}>
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <div className="w-full h-full bg-slate-950/90 rounded-[10px] flex items-center justify-center">
            <Bot className="w-4 h-4 text-indigo-300" />
          </div>
        )}
      </div>

      {/* Bubble Container */}
      <div className={`flex flex-col max-w-[88%] sm:max-w-[85%] min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Sender Name & Timestamp */}
        <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-300">{isUser ? 'You' : 'Nexus AI'}</span>
          <span>•</span>
          <span>{message.timestamp}</span>
          {message.status === 'sending' && (
            <span className="text-indigo-400 animate-pulse font-medium">sending...</span>
          )}
        </div>

        {/* Card Body */}
        <div className={`relative px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl text-sm sm:text-[15px] max-w-full overflow-hidden break-words shadow-lg ${
          isUser 
            ? 'glass-card-user text-white rounded-tr-sm' 
            : 'glass-card-bot text-slate-100 rounded-tl-sm border border-white/10'
        }`}>
          {/* ReactMarkdown rendering message text with custom typography formatting */}
          <div className="markdown-body prose prose-invert max-w-none text-slate-100 leading-relaxed text-sm sm:text-[15px] break-words overflow-hidden">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed break-words block">{children}</p>,
                strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                em: ({ children }) => <em className="italic text-indigo-200">{children}</em>,
                ul: ({ children }) => <ul className="list-disc list-outside pl-6 my-3 space-y-2 text-slate-200 block break-words">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-outside pl-6 my-3 space-y-2 text-slate-200 block break-words">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed pl-1 my-1 text-slate-200 list-item">{children}</li>,
                h1: ({ children }) => <h1 className="text-lg sm:text-xl font-extrabold text-white mt-5 mb-3 border-b border-white/10 pb-1.5 break-words block">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base sm:text-lg font-bold text-white mt-4 mb-2.5 break-words block">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm sm:text-base font-bold text-indigo-300 mt-3.5 mb-2 break-words block">{children}</h3>,
                table: ({ children }) => (
                  <div className="my-3 overflow-x-auto rounded-xl border border-white/15 shadow-md">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-slate-900/90 text-indigo-300 font-bold border-b border-white/10">{children}</thead>,
                tr: ({ children }) => <tr className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">{children}</tr>,
                th: ({ children }) => <th className="px-3.5 py-2 font-semibold">{children}</th>,
                td: ({ children }) => <td className="px-3.5 py-2 text-slate-300">{children}</td>,
                code: ({ className, children, ...props }: any) => {
                  const rawContent = String(children).replace(/\n$/, '');
                  const match = /language-(\w+)/.exec(className || '');
                  let language = match ? match[1] : '';
                  let content = rawContent;

                  // Check if content starts with a language keyword (e.g., "python def ...")
                  const langPrefixMatch = content.match(LANG_REGEX);
                  if (langPrefixMatch) {
                    if (!language) language = langPrefixMatch[1];
                    content = content.slice(langPrefixMatch[0].length);
                  }

                  const isMultiLine = rawContent.includes('\n') || 
                                      Boolean(match) || 
                                      Boolean(langPrefixMatch) || 
                                      CODE_KEYWORDS_REGEX.test(rawContent) ||
                                      rawContent.length > 40;

                  if (isMultiLine) {
                    return <CodeBlock language={language || 'code'} value={content} />;
                  }

                  return (
                    <code className="px-1.5 py-0.5 rounded-md bg-slate-900/90 border border-white/15 text-indigo-300 font-mono text-[13px] break-all inline-block" {...props}>
                      {children}
                    </code>
                  );
                },
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-indigo-500 bg-indigo-950/30 px-3.5 py-2 my-3 rounded-r-xl text-slate-300 text-xs sm:text-sm italic">
                    {children}
                  </blockquote>
                ),
                img: ({ src, alt }) => (
                  <img src={src} alt={alt} className="max-w-full h-auto rounded-xl border border-white/10 my-2.5 shadow-md" />
                ),
              }}
            >
              {processedText}
            </ReactMarkdown>
          </div>

          {/* Action Buttons for Bot Responses */}
          {!isUser && (
            <div className="flex items-center justify-between gap-3 mt-3 pt-2 border-t border-white/10 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 hover:text-slate-200 transition-colors flex items-center gap-1"
                  title="Copy full response"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? <span className="text-[10px] text-emerald-400 font-medium">Copied</span> : <span className="text-[10px]">Copy</span>}
                </button>

                <button
                  onClick={handleSpeak}
                  className={`px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1 ${speaking ? 'text-indigo-400 bg-indigo-500/10' : 'hover:text-slate-200'}`}
                  title={speaking ? "Stop reading" : "Read aloud"}
                >
                  {speaking ? <VolumeX className="w-3.5 h-3.5 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{speaking ? 'Stop' : 'Listen'}</span>
                </button>
              </div>

              {/* Feedback controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setLiked(liked === true ? null : true)}
                  className={`p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors ${liked === true ? 'text-emerald-400 bg-emerald-500/10' : 'hover:text-slate-200'}`}
                  title="Good response"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setLiked(liked === false ? null : false)}
                  className={`p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors ${liked === false ? 'text-rose-400 bg-rose-500/10' : 'hover:text-slate-200'}`}
                  title="Poor response"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

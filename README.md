# ⚡ Nexus AI — Next-Gen Workspace Intelligence

**Nexus AI** is a modern, high-performance, dark-themed AI chat workspace built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, and **Supabase**. It provides a sleek, responsive interface designed for seamless cross-device AI interaction with real-time session persistence and markdown response rendering.

---

## ✨ Features

- 🎨 **Modern Glassmorphic UI:** Ambient radial glow effects, sleek glass cards, custom scrollbars, and fluid micro-animations powered by Framer Motion.
- ⚛️ **High-Fidelity Animated Logo:** Custom multi-layered animated logo with ambient glow and continuous 360° rotating border rings.
- 📱 **Full Cross-Device Responsiveness:** Engineered for desktop, laptop, tablet, and mobile viewports with a responsive drawer sidebar and adaptive central chat console.
- 🔐 **Supabase Authentication:** Secure user registration and sign-in directly via Supabase Auth (`@supabase/supabase-js`).
- 💾 **Persistent Chat Sessions:** Real-time database persistence mapping user chat sessions and history directly to the authenticated user ID.
- 📝 **Markdown & Code Rendering:** Beautiful formatting for AI responses, code blocks, lists, and bold text using `react-markdown`.
- 🔌 **Plug-and-Play AI Webhook:** Integrates seamlessly with n8n, OpenAI, Gemini, or any HTTP endpoint via environment variables.

---

## 🛠️ Tech Stack

- **Frontend Framework:** React 18 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Vanilla CSS design system)
- **Animations:** Framer Motion + Canvas Confetti
- **Icons:** Lucide React
- **Authentication & Database:** Supabase (`@supabase/supabase-js`)
- **Markdown Processing:** ReactMarkdown
- **Deployment Platform:** Vercel

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js:** v18.x or higher
- **npm:** v9.x or higher

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/nexus-ai-chatbot.git
   cd nexus-ai-chatbot
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to create a local `.env` file:
   ```bash
   cp .env.example .env
   ```

4. **Fill in Your Credentials in `.env`:**
   ```env
   # Supabase Credentials (from your Supabase Dashboard -> Project Settings -> API)
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

   # n8n AI Webhook Endpoint (Optional / Production)
   VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-unique-path
   ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🔒 Security & Best Practices

> [!IMPORTANT]
> **Never commit your `.env` file or sensitive credentials to public GitHub repositories.**

- **Environment File Protection:** The `.env` file is included in `.gitignore` by default.
- **Supabase Row Level Security (RLS):** Ensure RLS policies are enabled on your Supabase `chat_sessions` table so users can only read and write their own data.
- **Webhook Security:** For production deployments, secure your n8n or backend AI webhooks using secret request headers or token verification.

---

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## 🌐 Deployment (Vercel)

1. Push your repository to GitHub.
2. Connect your repository to **Vercel**.
3. In the Vercel Project Settings, navigate to **Environment Variables** and add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_N8N_WEBHOOK_URL`
4. Click **Deploy**.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

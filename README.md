## PolyglotGPT - Conversational AI for Learning 50+ Languages
**A multilingual AI chatbot for language learners, built with Gemini API + React**  

PolyglotGPT is an open-source platform designed to help people **practice speaking and learning new languages** without the cost or limitations of traditional apps. Unlike Duolingo or standard AI chatbots, PolyglotGPT focuses on **real conversational practice**, **on-demand translation**, **romanization**, and **authentic speech synthesis**. 

👉 [Try it Yourself](https://polyglotgpt.com)  
👉 [Watch the Demo](https://www.loom.com/share/fe7c88ef0cd24bcabd40f41c09e11e36?sid=4ef5308a-fb07-47e0-961f-ed62e7e69d1d)  

---

## 🚀 Motivation  
Learning languages can be frustrating:  
- Textbook learning feels clinical and disconnected.  
- Apps like Duolingo don’t provide real practice.  
- Existing AI chatbots lack **quick translation**, **romanization**, and **universal speech support**.  

PolyglotGPT is my attempt to fix that, using AI as a free, accessible practice partner.  

---

## ✨ Features  
- **50+ Languages Supported** – Powered by Gemini 2.5 Flash API.  
- **Native & Target Language Selection** – Choose what you speak and what you’re learning.  
- **One-Click Translation** – Translate any AI message instantly.  
- **One-Click Romanization** – Convert non-Latin scripts into phonetic Latin script.  
- **Authentic Text-to-Speech** – Listen to AI responses in multiple languages/accents (Google TTS).  
- **Popup-on-Highlight Tools** – Select text to translate, explain, or hear speech instantly.  
- **Smart Language Guidance** – The AI corrects grammar/spelling, explains words, and keeps the conversation flowing.  

---

## 🛠️ Tech Stack  
- **Frontend:** React.js + Tailwind CSS  
- **Icons:** [Lucide](https://lucide.dev/) (Creative Commons)  
- **Database:** MongoDB Atlas  
- **Auth:** Clerk  
- **LLM API:** Gemini 3 Flash (low-latency, multilingual)  
- **Text-to-Speech:** Google TTS  

---

## 📦 Getting Started  

Clone the repo:  
```bash
git clone https://github.com/shawshaenk/polyglotgpt.git
cd polyglotgpt
```

Install dependencies:
```bash
npm install
```

Set up environment variables (create .env.local):
```bash
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key
NEXT_PUBLIC_MONGO_URI=your_mongodb_connection
NEXT_PUBLIC_CLERK_API_KEY=your_clerk_key
NEXT_PUBLIC_TTS_API_KEY=your_google_tts_key
```

Run locally:
```bash
npm run dev
```

## 🔮 Roadmap  
- [ ] **Speech-to-Text input** for easier voice conversations.  
- [ ] **Conversational speaking mode** powered by Gemini Live API or ChatGPT Realtime API.  

---

## 🤝 Contributing  
Pull requests are welcome! If you’d like to add features, improve the system prompt, or optimize the frontend, feel free to fork the repo and submit a PR.  

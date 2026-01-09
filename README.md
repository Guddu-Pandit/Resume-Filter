# ResumeFlow 🚀

**ResumeFlow** is a premium, AI-powered resume management and analysis platform. It helps users organize their resume collection, perform deep analysis using Google Gemini AI, and find the right talent through semantic search and vector embeddings.

![Modern Dashboard](https://img.shields.io/badge/UI-Premium-success)
![AI Powered](https://img.shields.io/badge/AI-Google_Gemini-blue)
![Database](https://img.shields.io/badge/DB-MongoDB_%26_Pinecone-green)

---

## ✨ Key Features

### 🛠️ Advanced Resume Management
- **Smooth Uploads**: Supports `.pdf`, `.doc`, and `.docx` formats.
- **Collapsible Grid**: A clean, organized view of your resumes with a "See More/Less" toggle for better performance and UX.
- **Instant Previews**: View resume content directly in the browser without downloading.
- **Integrated Search**: Fast, responsive search to filter through your collection.

### 🧠 AI-Powered Insights
- **Resume Analysis**: Leverage Google Gemini to analyze resumes for specific skills, experience, and suitability for job roles.
- **Semantic Search**: (Powered by Pinecone) Go beyond keyword matching with AI-driven vector embeddings for precise talent discovery.

### 🎨 Premium User Experience
- **Collapsible Sidebar**: A sleek, animated sidebar with unified branding, smooth slide transitions, and a clean typewriter effect for the brand name.
- **Glassmorphism Design**: Modern, clean aesthetics with vibrant colors and subtle micro-animations.
- **Dashboard Overview**: Get a bird's-eye view of your data immediately upon logging in.

---

## 🚀 Tech Stack

### Frontend
- **React.js (Vite)**: For a fast, modern development experience.
- **Tailwind CSS 4.0**: Industry-standard utility-first CSS for premium styling.
- **Lucide React**: Beautifully crafted icons for a cohesive UI.
- **React Router 7**: Robust routing for a seamless SPA experience.
- **Context API**: For global state management (Auth, Toasts, etc.).

### Backend
- **Node.js & Express**: Scalable and fast server-side logic.
- **MongoDB (Mongoose)**: Robust document-based storage for resume metadata.
- **Pinecone**: High-performance vector database for AI-driven semantic search.
- **Google Gemini AI**: State-of-the-art LLM for resume analysis and processing.
- **Multer**: Handling multi-part file uploads safely.

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API Key
- Pinecone API Key

### 1. Clone the Repository
```bash
git clone https://github.com/Guddu-Pandit/Resume-Filter.git
cd Resume-Filter
```

### 2. Setup the Server
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory and add your credentials:
```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_env
```
Start the server:
```bash
npm run start
```

### 3. Setup the Client
```bash
cd ../client
npm install
```
Start the frontend:
```bash
npm run dev
```

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the ISC License.

---

Developed with ❤️ by [Guddu-Pandit](https://github.com/Guddu-Pandit)

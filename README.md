# Semantic Intel: The AI-Powered Code Explorer 🌌

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![Ollama](https://img.shields.io/badge/AI-Ollama-orange)
![Three.js](https://img.shields.io/badge/Visuals-Three.js-white)

## Overview 🔭

**Semantic Intel** is a revolutionary code analysis platform designed to transform how developers understand complex software systems. By combining high-performance Abstract Syntax Tree (AST) parsing with the visual intelligence of Google Gemini and the local processing power of **Ollama (Qwen 2.5)**, Semantic Intel provides an unprecedented **"god-eye view"** of your codebase.

Navigate your project as a living 3D galaxy, detect architectural drift in real-time, and leverage AI to extract semantic intent—all from a privacy-focused local environment.

> **"Turn your code into a navigable universe."**

---

## ✨ Key Features

### 🛸 3D Dependency Galaxy
Traverse your codebase as an interactive, force-directed 3D graph. Visualize coupling, fan-in/fan-out, and structural bottlenecks instantly. Identify "god classes" and spaghetti code visually.

### 🧠 Semantic Intelligence
Powered by **Ollama (Qwen 2.5)** running locally, Semantic Intel understands the *intent* behind your code, not just the syntax. It automatically detects anti-patterns, explains complex logic, and suggests refactoring opportunities in human-readable language.

### 📊 Living Health Metrics
Track modularity, complexity, and maintainability scores dynamically as your codebase evolves. Get real-time feedback on the health of your architecture.

### 🔍 automated Issue & Pattern Recognition
Automatically identify circular dependencies, cross-cutting concerns, and violations of architectural principles.

### 📄 Interactive Visual Reports
Generate deep-dive reports (PDF/Interactive) for stakeholders, visualize technical debt, and justify refactoring efforts with data.

---

## 🛠️ Tech Stack

Semantic Intel is built on a modern, high-performance stack:

-   **Frontend Framework**: [Next.js 14](https://nextjs.org/) (App Router) for server-side rendering and static generation.
-   **AI Engine**: [Ollama](https://ollama.com/) running **Qwen 2.5-Coder** (0.5b/3b) for local, private AI inference.
-   **Visualization**: [Three.js](https://threejs.org/) & [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) for 3D rendering; [Framer Motion](https://www.framer.com/motion/) for UI animations.
-   **Data Persistence**: [Supabase](https://supabase.com/) for Authentication, Database, and Storage (PostgreSQL).
-   **Code Analysis**: [Web-Tree-Sitter](https://github.com/tree-sitter/web-tree-sitter) for robust, language-agnostic AST parsing.
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) for utility-first styling.

---

## 🏗️ Architecture Summary

The system operates on a pipeline architecture:

1.  **Ingestion**: Source code is ingested and parsed into Abstract Syntax Trees (ASTs) using `web-tree-sitter`.
2.  **Analysis**: Heuristics extract dependency graphs, complexity metrics, and semantic tokens.
3.  **Enrichment**: The **Ollama AI Agent** analyzes code semantics to detect patterns and generate explanations.
4.  **Visualization**: The processed data is rendered as a 3D force graph in the browser, allowing for interactive exploration.

---

## � Documentation Index

Deep dive into the specifics of Semantic Intel:

- 🏗️ **[Architecture Overview](./docs/ARCHITECTURE.md)**: System design and analysis pipeline.
- 🚀 **[Getting Started](./docs/DEVELOPMENT.md)**: Local setup and development workflow.
- 💎 **[Ollama AI Setup](./OLLAMA_SETUP.md)**: AI configuration and model details.
- 🌐 **[Deployment Guide](./docs/DEPLOYMENT.md)**: Vercel & Supabase production setup.
- 📊 **[Evaluation Metrics](./docs/evaluation_metrics.md)**: Accuracy and quality benchmarks for the analysis engine.
- ☁️ **[Supabase Storage](./docs/supabase_storage_setup.md)**: Manual setup guide for report storage buckets.
- 📜 **[Scripts Guide](./README_SCRIPTS.md)**: Usage instructions for the PowerShell automation scripts.
- 🤝 **[Contributing](./CONTRIBUTING.md)**: Guidelines for contributors.

---

## �🚀 Getting Started

### Prerequisites

-   **Node.js** 18+
-   **Ollama** installed and running locally
-   **Supabase** project (optional for local dev with mocks, required for full features)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/semantic-intel.git
    cd semantic-intel
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up AI Models**
    Ensure Ollama is running and pull the required models:
    ```bash
    ollama pull qwen2.5-coder:0.5b
    # and optionally
    ollama pull qwen2.5-vl:3b
    ```

4.  **Configure Environment Variables**
    Create a `.env.local` file in the root directory:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    
    # AI Configuration
    OLLAMA_BASE_URL=http://localhost:11434
    OLLAMA_MODEL_CODE=qwen2.5-coder:0.5b
    OLLAMA_MODEL_VL=qwen2.5-coder:0.5b
    ```

5.  **Run the Development Server**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Windows Users
For convenience, you can use the provided PowerShell scripts:
```powershell
.\setup.ps1  # Installs dependencies
.\run.ps1    # Starts the dev server
```

---

## � Screenshots

*(Placeholder for screenshots of the 3D Graph, AI Chat Interface, and Dashboard)*

![Dashboard Preview](https://via.placeholder.com/800x450?text=Semantic+Intel+Dashboard)

---

## 🤝 Contributing

We welcome contributions from the community! Whether it's bug fixes, feature requests, or documentation improvements.

1.  **Fork** the repository
2.  Create your **feature branch** (`git checkout -b feature/AmazingFeature`)
3.  **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4.  **Push** to the branch (`git push origin feature/AmazingFeature`)
5.  Open a **Pull Request**

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📬 Contact

Project Link: [https://github.com/yourusername/semantic-intel](https://github.com/yourusername/semantic-intel)

---
*Built with ❤️ by the Semantic Intel Team.*

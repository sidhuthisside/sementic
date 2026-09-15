# Developer Guide

Welcome to the Semantic Intel development guide. This document provides instructions for setting up your local environment, understanding the codebase, and contributing to the project.

## 1. Setup

### Prerequisites
- **Node.js**: v18 or later.
- **npm**: v9 or later.

### Environment Configuration
Copy the `.env.example` (if present) or create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL_CODE=qwen2.5-coder:0.5b
OLLAMA_MODEL_VL=qwen2.5-coder:0.5b

```

### Installation
```bash
npm install
```

## 2. Development Workflow

### Running the App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the result.

### Linting
```bash
npm run lint
```

## 3. Directory Structure

- **`/app`**: Next.js App Router pages and API routes.
- **`/components`**: Reusable React components.
    - **`/ui`**: Base UI components.
    - **`/dashboard`**: Components used in the analysis dashboard.
    - **`/explorer`**: Components for the 3D galaxy and file explorer.
- **`/lib`**: Core logic and utility functions.
    - **`/analyzer`**: The heart of the semantic analysis engine.
    - **`/ai`**: AI-specific integrations and prompts.
- **`/public`**: Static assets.
- **`/scripts`**: Utility scripts for diagnostics and testing.

## 4. UI & Visualizations

Semantic Intel uses a combination of Three.js and Framer Motion for its "wow" factor.
- **Three.js**: Used for the 3D Dependency Galaxy (`components/explorer/GalaxyViewer`).
- **Framer Motion**: Used for smooth transitions and micro-animations throughout the UI.

## 5. Testing & Diagnostics

The `scripts/test` directory contains several utility scripts to verify integration points:
- `test-github-token.js`: Verifies GitHub API authentication.
- `diagnostic.js`: Runs a comprehensive system check.

To run a script:
```bash
node scripts/test/diagnostic.js
```

## 6. Contribution Guidelines

See [CONTRIBUTING.md](file:///c:/Dev/ab/SEMANTIC-TEST/CONTRIBUTING.md) for details on our pull request process and coding standards.

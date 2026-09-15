# Ollama AI Setup Guide

Semantic Intel now leverages **Ollama** to provide local, privacy-focused AI capabilities. This guide will help you set up and configure the AI integration.

## 1. Install Ollama

1.  Download and install Ollama from [ollama.com](https://ollama.com/).
2.  Ensure the Ollama service is running.

## 2. Pull Required Models

Open your terminal and pull the specific Qwen 2.5 models used by Semantic Intel:

```bash
# Pull the coding model (used for everything now)
ollama pull qwen2.5-coder:0.5b
```

## 3. Configure Environment Variables

Create or update your `.env.local` file in the root of the project:

```env
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434  # Or your ngrok URL
OLLAMA_MODEL_CODE=qwen2.5-coder:0.5b
OLLAMA_MODEL_VL=qwen2.5-coder:0.5b
```

## 4. Remote Access with ngrok

To expose your local Ollama instance to the internet (e.g., for use with a deployed version of Semantic Intel), you can use **ngrok**.

### Step 1: Install ngrok
Download and install ngrok from [ngrok.com](https://ngrok.com/download).

### Step 2: Start Ollama
Ensure Ollama is running locally on port 11434:
```bash
ollama serve
```

### Step 3: Start ngrok Tunnel
Run the following command in a new terminal window to tunnel traffic to your local Ollama port:
```bash
ngrok http 11434 --host-header="localhost:11434"
```
*Note: The `--host-header` flag is crucial for some configurations to prevent "invalid host header" errors.*

### Step 4: Update Environment Variables
Copy the `https` URL provided by ngrok (e.g., `https://random-id.ngrok-free.app`) and update your `.env.local` file:

```env
OLLAMA_BASE_URL=https://random-id.ngrok-free.app
```

### Troubleshooting

- **Connection Refused**: Ensure Ollama is running (`ollama serve`).
- **Model Not Found**: Verify you have pulled the exact model names (`qwen2.5-coder:3b` and `qwen2.5-vl:3b`).
- **403 Forbidden**: Ensure you are using the `https` URL from ngrok.

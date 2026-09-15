# Project Management Scripts

This project includes PowerShell scripts to streamline the local development workflow on Windows.

## 🚀 Scripts Overview

| Script | Description |
| :--- | :--- |
| `setup.ps1` | Installs dependencies and checks environment configuration. |
| `run.ps1` | Starts the Next.js development server. |

---

## 🛠️ Usage

### 1. Setup (`setup.ps1`)
Run this script once after cloning the repository or when dependencies change.

```powershell
.\setup.ps1
```

**What it does:**
- Installs Node.js dependencies (`npm install`).
- Checks for `.env.local` configuration.
- Verifies if **Ollama** is running (optional).

### 2. Run (`run.ps1`)
Starts the application in development mode.

```powershell
.\run.ps1
```

**What it does:**
- Starts the **Next.js** frontend on [http://localhost:3000](http://localhost:3000).
- Keeps the terminal open for logs.
- Automatically handles cleanup when you close the window or press `Ctrl+C`.

---

## 🛑 Troubleshooting

- **Permission Denied**: If you can't run scripts, you might need to change your execution policy:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```
- **Ollama Not Found**: Ensure you have installed [Ollama](https://ollama.com/) and it is running in the background.

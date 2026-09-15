export const mockData = {
    comparison: {
        source: {
            name: "architect-ai-v1",
            metrics: { maintainability: 92, complexity: 14, coverage: 78, performance: 88, security: 95 },
            patterns: [
                { subject: "Singleton", A: 95, fullMark: 100 },
                { subject: "Observer", A: 88, fullMark: 100 },
                { subject: "MVC", A: 92, fullMark: 100 },
            ]
        },
        target: {
            name: "architect-ai-v2-beta",
            metrics: { maintainability: 85, complexity: 18, coverage: 65, performance: 94, security: 80 },
            patterns: [
                { subject: "Singleton", A: 80, fullMark: 100 },
                { subject: "Observer", A: 95, fullMark: 100 },
                { subject: "MVC", A: 75, fullMark: 100 },
            ]
        },
        diffCode: {
            original: `function calculateTotal(items) {
  return items.reduce((acc, item) => acc + item.price, 0);
}`,
            modified: `function calculateTotal(items) {
  // Optimized for performance
  let total = 0;
  for(let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;}`
        }
    },
    graph: {
        nodes: Array.from({ length: 50 }, (_, i) => ({
            id: `node-${i}`,
            group: i % 3 === 0 ? "controller" : i % 3 === 1 ? "service" : "model",
            name: i % 3 === 0 ? `UserController${i}` : i % 3 === 1 ? `AuthService${i}` : `User${i}`,
            val: Math.random() * 20 + 5,
        })),
        links: Array.from({ length: 80 }, () => ({
            source: `node-${Math.floor(Math.random() * 50)}`,
            target: `node-${Math.floor(Math.random() * 50)}`,
        })),
    },
    metrics: {
        health: 85,
        maintainability: 92,
        complexity: 14,
        coverage: 78,
    },
    fileSystem: {
        name: "root",
        type: "folder",
        children: [
            {
                id: "src",
                name: "src",
                type: "folder",
                children: [
                    {
                        id: "components",
                        name: "components",
                        type: "folder",
                        children: [
                            { id: "Button.tsx", name: "Button.tsx", type: "file", language: "typescript" },
                            { id: "Header.tsx", name: "Header.tsx", type: "file", language: "typescript" },
                        ]
                    },
                    { id: "utils.ts", name: "utils.ts", type: "file", language: "typescript" },
                    { id: "App.tsx", name: "App.tsx", type: "file", language: "typescript" },
                ]
            },
            {
                id: "server",
                name: "server",
                type: "folder",
                children: [
                    { id: "server.js", name: "server.js", type: "file", language: "javascript" },
                    { id: "models.py", name: "models.py", type: "file", language: "python" },
                ]
            },
            { id: "package.json", name: "package.json", type: "file", language: "json" },
            { id: "README.md", name: "README.md", type: "file", language: "markdown" },
        ]
    },
    fileContents: {
        "App.tsx": `import React from 'react';
import Header from './components/Header';

export default function App() {
  return (
    <div className="app">
      <Header />
      <main>
        <h1>Welcome to Architect AI</h1>
        <p>Analyze your code in 3D.</p>
      </main>
    </div>
  );
}`,
        "utils.ts": `export const calculateMetric = (data: number[]) => {
  return data.reduce((a, b) => a + b, 0) / data.length;
};

export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US').format(date);
};`,
        "models.py": `from django.db import models

class User(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name`,
        "server.js": `const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(\`Example app listening at http://localhost:\${port}\`);
});`
    },
    patterns: [
        { title: "Singleton Pattern", confidence: 95, color: "#00f3ff" },
        { title: "Observer Pattern", confidence: 88, color: "#bc13fe" },
        { title: "MVC Architecture", confidence: 92, color: "#ff00ff" },
    ],
    issues: [
        { id: 1, title: "Circular Dependency Detected", severity: "high" },
        { id: 2, title: "Unused Variable in AuthController", severity: "low" },
        { id: 3, title: "High Cyclomatic Complexity", severity: "medium" },
    ],
    recommendations: [
        { id: 1, title: "Refactor AuthService to reduce complexity" },
        { id: 2, title: "Extract interface for User model" },
        { id: 3, title: "Implement dependency injection container" },
    ]
};

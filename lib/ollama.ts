
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_TEXT_MODEL = process.env.OLLAMA_MODEL_CODE || 'qwen2.5-coder:0.5b';
const DEFAULT_VL_MODEL = process.env.OLLAMA_MODEL_VL || 'qwen2.5-coder:0.5b';

export const ollama = {
    async generate(prompt: string, options: { model?: string, format?: string, options?: any } = {}) {
        const { model: overrideModel, format, options: genOptions } = options;
        const model = overrideModel || DEFAULT_TEXT_MODEL;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout

        try {
            console.log(`[Ollama] Attempting generation with model: ${model} at ${OLLAMA_BASE_URL}`);
            const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    prompt,
                    format, // Add format support (e.g. "json")
                    stream: false,
                    options: {
                        num_ctx: 4096,
                        temperature: 0.2,
                        ...genOptions
                    }
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama API error: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            clearTimeout(timeoutId);
            console.error(`❌ [Ollama] Generation failed:`, error);
            throw error;
        }
    },

    async * chatStream(messages: { role: string; content: string }[], options: { model?: string, [key: string]: any } = {}) {
        const { model: overrideModel, ...restOptions } = options;
        const model = overrideModel || DEFAULT_TEXT_MODEL;

        try {
            console.log(`[Ollama] Attempting chat stream with model: ${model} at ${OLLAMA_BASE_URL}`);

            // Convert messages to format Ollama expects
            const ollamaMessages = messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    messages: ollamaMessages,
                    stream: true,
                    options: restOptions // Pass temperature, repeat_penalty, etc.
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama API error: ${response.status} ${errorText}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error("Ollama response body is null");

            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const json = JSON.parse(line);
                        if (json.message?.content) {
                            yield json.message.content;
                        }
                        if (json.done) return;
                    } catch (e) {
                        console.warn("⚠️ [Ollama] Failed to parse stream chunk:", line);
                    }
                }
            }
        } catch (error) {
            console.error(`❌ [Ollama] Chat stream failed:`, error);
            throw error;
        }
    }
};

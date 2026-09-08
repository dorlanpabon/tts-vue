interface PromptGPT {
    promptGPT: string,
    model: string,
    key: string,
    retryCount: number,
    retryInterval: number,
    baseURL?: string,
}

// Proveedores de IA compatibles con la API de OpenAI (chat.completions).
// OpenRouter expone modelos gratuitos (sufijo :free, $0) con una clave gratis;
// "custom" permite Ollama local u otro endpoint compatible.
export const AI_PROVIDER_BASE_URLS: Record<string, string> = {
    openai: "https://api.openai.com/v1",
    openrouter: "https://openrouter.ai/api/v1",
    zen: "https://opencode.ai/zen/v1",
    custom: "",
};

export { PromptGPT }
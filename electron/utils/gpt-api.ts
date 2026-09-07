import OpenAI from 'openai';
import logger from "../utils/log";

const gptApi = async (promptGPT: string, model: string, key: string, baseURL?: string) => {
    logger.info(`promptGPT: ${promptGPT}`);
    const openai = new OpenAI({
        // "not-needed" permite endpoints locales sin clave (ej. Ollama).
        apiKey: key || "not-needed",
        baseURL: baseURL || "https://api.openai.com/v1",
        // Requeridas/recomendadas por OpenRouter; inofensivas para OpenAI.
        defaultHeaders: {
            "HTTP-Referer": "https://github.com/dorlanpabon/tts-vue",
            "X-Title": "tts-vue",
        },
    });
    logger.info(`model: ${model}`);
    const chatCompletion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: promptGPT }],
        model: model,
    });
    logger.info(`chatCompletion: ${JSON.stringify(chatCompletion)}`);

    return chatCompletion.choices[0].message.content;
}

export { gptApi };
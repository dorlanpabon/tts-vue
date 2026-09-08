import OpenAI from 'openai';
import logger from "../utils/log";
import { pickFreeFallback } from "../../src/global/aiModels";

async function complete(openai: any, model: string, promptGPT: string) {
    const chatCompletion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: promptGPT }],
        model: model,
    });
    logger.info(`chatCompletion: ${JSON.stringify(chatCompletion)}`);
    return chatCompletion.choices[0].message.content;
}

const gptApi = async (promptGPT: string, model: string, key: string, baseURL?: string) => {
    logger.info(`promptGPT: ${promptGPT}`);
    const resolvedBaseURL = baseURL || "https://api.openai.com/v1";
    const openai = new OpenAI({
        // "not-needed" permite endpoints locales sin clave (ej. Ollama).
        apiKey: key || "not-needed",
        baseURL: resolvedBaseURL,
        // Requeridas/recomendadas por OpenRouter; inofensivas para OpenAI.
        defaultHeaders: {
            "HTTP-Referer": "https://github.com/dorlanpabon/tts-vue",
            "X-Title": "tts-vue",
        },
    });
    logger.info(`model: ${model}`);
    try {
        return await complete(openai, model, promptGPT);
    } catch (firstError) {
        // Un reintento con otro gratis (nunca modelos de pago).
        const next = pickFreeFallback(model, resolvedBaseURL, firstError);
        if (!next) throw firstError;
        logger.info(`free model ${model} failed, fallback to ${next}`);
        return await complete(openai, next, promptGPT);
    }
}

export { gptApi };
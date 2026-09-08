import OpenAI from 'openai';
import logger from "../utils/log";

// Modelos :free (verificados $0) para reintento automatico cuando el
// elegido falla por el lado del proveedor. Mismo orden que el desplegable.
const FREE_FALLBACK_MODELS = [
    "google/gemma-4-31b-it:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "nvidia/nemotron-3.5-lightning:free",
    "minimax/minimax-m3:free",
    "minimax/minimax-m2.7:free",
    "thinkingmachines/inkling:free",
    "thinkingmachines/inkling-small:free",
];

// true si el fallo es del proveedor (nunca de la clave): 404 modelo rotado,
// 429 limite, 402, 5xx, "Provider returned error", saturacion. 401 no entra.
function isProviderSideError(error: any): boolean {
    const s = String((error && (error as any).message) || error);
    if (/(^|[^0-9])401([^0-9]|$)/.test(s) || /unauthorized|authentication/i.test(s)) {
        return false;
    }
    return (
        /(^|[^0-9])404([^0-9]|$)/.test(s) ||
        /(^|[^0-9])429([^0-9]|$)/.test(s) ||
        /(^|[^0-9])402([^0-9]|$)/.test(s) ||
        /(^|[^0-9])5[0-9]{2}([^0-9]|$)/.test(s) ||
        /provider returned error|overloaded|capacity|no endpoints|rate.?limit|payment|credits|insufficient/i.test(s)
    );
}

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
        // Solo OpenRouter + modelo :free: un reintento con otro gratis.
        // Jamas se rotan modelos de pago (sorpresa en factura).
        const canFallback =
            /:free$/.test(model || "") &&
            resolvedBaseURL.includes("openrouter") &&
            isProviderSideError(firstError);
        if (!canFallback) throw firstError;
        const next = FREE_FALLBACK_MODELS.find((m) => m !== model);
        if (!next) throw firstError;
        logger.info(`free model ${model} failed, fallback to ${next}`);
        return await complete(openai, next, promptGPT);
    }
}

export { gptApi };
// Chequeo de salud de las APIs sin gastar cuota: no sintetiza nada.
// - speech: lista de voces del trial (200 = alcanzable, 429 = cuota).
// - edge: solo handshake WebSocket (se cierra enseguida).
// - openrouter: catalogo publico de modelos.
// - zen: endpoint con clave dummy (401 = alcanzable, red = caido).
const axios = require("axios");
const { WebSocket } = require("ws");
const { randomBytes } = require("crypto");
import logger from "../utils/log";

export interface HealthItem {
  ok: boolean;
  detail: string;
  ms?: number;
}

export interface HealthReport {
  speech: HealthItem;
  edge: HealthItem;
  openrouter: HealthItem;
  zen: HealthItem;
}

const short = (s: any) => String(s == null ? "" : s).slice(0, 90);

async function checkVoices(): Promise<HealthItem> {
  const t0 = Date.now();
  try {
    await axios({
      method: "post",
      url: "https://southeastasia.api.speech.microsoft.com/accfreetrial/texttospeech/acc/v3.0-beta1/vcg/voices",
      timeout: 8000,
      headers: {
        authority: "southeastasia.api.speech.microsoft.com",
        accept: "application/json, text/plain, */*",
        origin: "https://speech.microsoft.com",
        "content-type": "application/json",
        "user-agent": "Mozilla/5.0",
      },
      data: JSON.stringify({
        queryCondition: {
          items: [{ name: "VoiceTypeList", value: "StandardVoice", operatorKind: "Contains" }],
        },
      }),
    });
    return { ok: true, detail: "200 OK", ms: Date.now() - t0 };
  } catch (e: any) {
    const status = e && e.response && e.response.status;
    if (status === 429) return { ok: false, detail: "429 cuota agotada" };
    if (status) return { ok: false, detail: `HTTP ${status}` };
    return { ok: false, detail: short(e && e.message) || "sin red" };
  }
}

async function checkEdge(): Promise<HealthItem> {
  const t0 = Date.now();
  return new Promise((resolve) => {
    let done = false;
    const finish = (r: HealthItem) => {
      if (!done) {
        done = true;
        resolve(r);
      }
    };
    const timer = setTimeout(() => {
      try {
        ws.close();
      } catch (e) {}
      finish({ ok: false, detail: "timeout" });
    }, 8000);
    const cid = randomBytes(16).toString("hex").toLowerCase();
    const ws = new WebSocket(
      `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&ConnectionId=${cid}`,
      {
        headers: {
          Origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.212",
        },
      }
    );
    ws.on("open", () => {
      clearTimeout(timer);
      try {
        ws.close();
      } catch (e) {}
      finish({ ok: true, detail: "handshake OK", ms: Date.now() - t0 });
    });
    ws.on("error", (e: any) => {
      clearTimeout(timer);
      const msg = short(e && e.message);
      finish({
        ok: false,
        detail: /403/.test(msg) ? "403 denegado" : msg || "error",
      });
    });
  });
}

async function checkOpenRouter(): Promise<HealthItem> {
  const t0 = Date.now();
  try {
    await axios.get("https://openrouter.ai/api/v1/models", { timeout: 8000 });
    return { ok: true, detail: "200 OK", ms: Date.now() - t0 };
  } catch (e: any) {
    const status = e && e.response && e.response.status;
    if (status) return { ok: false, detail: `HTTP ${status}` };
    return { ok: false, detail: short(e && e.message) || "sin red" };
  }
}

async function checkZen(): Promise<HealthItem> {
  const t0 = Date.now();
  try {
    await axios.post(
      "https://opencode.ai/zen/v1/chat/completions",
      { model: "mimo-v2.5-free", messages: [{ role: "user", content: "hi" }] },
      {
        timeout: 8000,
        headers: {
          "content-type": "application/json",
          Authorization: "Bearer health-check",
        },
      }
    );
    return { ok: true, detail: "200 OK", ms: Date.now() - t0 };
  } catch (e: any) {
    const status = e && e.response && e.response.status;
    // 401 = endpoint vivo (falta clave valida). Solo red caida es fallo.
    if (status === 401) return { ok: true, detail: "vivo (pide clave)", ms: Date.now() - t0 };
    if (status) return { ok: false, detail: `HTTP ${status}` };
    return { ok: false, detail: short(e && e.message) || "sin red" };
  }
}

const healthCheck = async (): Promise<HealthReport> => {
  const [speech, edge, openrouter, zen] = await Promise.all([
    checkVoices().catch((e) => ({ ok: false, detail: short(e && e.message) } as HealthItem)),
    checkEdge().catch((e) => ({ ok: false, detail: short(e && e.message) } as HealthItem)),
    checkOpenRouter().catch((e) => ({ ok: false, detail: short(e && e.message) } as HealthItem)),
    checkZen().catch((e) => ({ ok: false, detail: short(e && e.message) } as HealthItem)),
  ]);
  logger.info(`health: speech=${speech.ok} edge=${edge.ok} openrouter=${openrouter.ok} zen=${zen.ok}`);
  return { speech, edge, openrouter, zen };
};

export default healthCheck;

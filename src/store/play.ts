import { ipcRenderer } from "electron";
import { PromptGPT } from "@/types/prompGPT";
import { buildSsml, buildSsmlEdge } from "@/global/ssml";
import { errText, isQuotaError } from "@/global/ttsErrors";

async function getTTSData(
  inps: any,
  voice: string,
  express: string,
  role: string,
  rate = 0,
  pitch = 0,
  api: number,
  key: string,
  region: string,
  retryCount: number,
  retryInterval = 1,
) {
  // 判断retryCount是否为0或者null，如果是则不重试
  if (!retryCount) {
    retryCount = 1;
  }
  if (!retryInterval) {
    retryInterval = 1;
  }
  let SSML = "";
  // SSML centralizado (ver src/global/ssml.ts). Normaliza api boolean legacy.
  const apiNum = Number(api);
  if (inps.activeIndex == "1" && (apiNum === 1 || apiNum === 3)) {
    SSML = buildSsml({
      voice,
      style: express,
      role,
      rate,
      pitch,
      text: inps.inputValue,
    });
  }
  else if (inps.activeIndex == "1" && apiNum === 2) {
    SSML = buildSsmlEdge({
      voice,
      rate,
      pitch,
      text: inps.inputValue,
    });
  }
  else {
    SSML = inps.inputValue;
  }
  ipcRenderer.send("log.info", SSML);
  console.log(SSML);
  // Red de seguridad: si el primario gratuito falla por cuota y hay
  // credenciales Azure, se reintenta UNA vez contra Azure (sin recursion).
  const hasAzureBackup =
    apiNum !== 3 &&
    key != null &&
    key !== "" &&
    region != null &&
    region !== "";
  const azureFallback = async (primaryError: any) => {
    ipcRenderer.send(
      "log.info",
      `Primary TTS API failed (${errText(primaryError).slice(0, 120)}), trying Azure fallback...`
    );
    try {
      return await ipcRenderer.invoke("azureApi", SSML, key, region);
    } catch (azureError) {
      throw new Error(`TTS_AZURE_FAILED: ${errText(azureError)}`);
    }
  };
  if (apiNum === 1) {
    try {
      const result = await retrySpeechInvocation(SSML, retryCount, retryInterval * 1000);
      return result;
    } catch (error) {
      if (hasAzureBackup && isQuotaError(error)) return azureFallback(error);
      throw error;
    }
  } else if (apiNum === 2) {
    try {
      const result = await ipcRenderer.invoke("edgeApi", SSML);
      return result;
    } catch (error) {
      if (hasAzureBackup && isQuotaError(error)) return azureFallback(error);
      throw error;
    }
  } else {
    try {
      const result = await ipcRenderer.invoke("azureApi", SSML, key, region);
      return result;
    } catch (azureError) {
      throw new Error(`TTS_AZURE_FAILED: ${errText(azureError)}`);
    }
  }
}
async function retrySpeechInvocation(SSML: string, retryCount: number, delay: number) {
  let retry = 0;
  let wait = delay;
  while (retry < retryCount) {
    try {
      console.log("Speech attempt:", retry + 1);
      const result = await ipcRenderer.invoke("speech", SSML);
      return result; // 执行成功，返回结果
    } catch (error) {
      const s = String(error);
      // 429 (cuota gratuita agotada) y 403 (acceso denegado) no se recuperan
      // reintentando: se falla rapido con un codigo que la UI traduce.
      if (s.includes("TTS_RATE_LIMITED") || /toomanyrequests/i.test(s) || /(^|[^0-9])429([^0-9]|$)/.test(s)) {
        throw new Error(`TTS_RATE_LIMITED: ${s}`);
      }
      if (s.includes("TTS_ACCESS_DENIED") || /(^|[^0-9])403([^0-9]|$)/.test(s)) {
        throw new Error(`TTS_ACCESS_DENIED: ${s}`);
      }
      // Transitorios: backoff exponencial con jitter, respetando Retry-After.
      const retryAfter = parseRetryAfterMs(error);
      const jitter = Math.floor(Math.random() * 1000);
      const sleepMs = Math.min((retryAfter ?? wait) + jitter, 60000);
      console.error(`Speech invocation failed (retry ${retry + 1}, waiting ${sleepMs}ms):`, error);
      await sleep(sleepMs); // 暂停一段时间后再重试
      wait = Math.min(wait * 2, 30000);
    }
    retry++;
  }
  throw new Error(`TTS_CONVERT_FAILED after ${retryCount} retries.`); // 重试次数用尽，抛出异常
}
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
// Extrae Retry-After (segundos o fecha HTTP) si el backend lo envia.
// Los errores cruzan IPC serializados: se lee defensivamente.
function parseRetryAfterMs(error: any): number | null {
  try {
    const headers = error && (error as any).response && (error as any).response.headers;
    const raw = headers && headers["retry-after"];
    if (raw == null || raw === "") return null;
    const secs = Number(raw);
    if (Number.isFinite(secs) && secs >= 0) return secs * 1000;
    const at = Date.parse(String(raw));
    if (!Number.isNaN(at)) return Math.max(0, at - Date.now());
  } catch (e) {
    // ignora cabeceras malformadas
  }
  return null;
}
// promptGPT 
async function getDataGPT(options: PromptGPT) {
  let { promptGPT, model, key, baseURL, retryCount, retryInterval=1 } = options;
  // 判断retryCount是否为0或者null，如果是则不重试
  if (!retryCount) {
    retryCount = 1;
  }
  if (!retryInterval) {
    retryInterval = 1;
  }
  const result = await ipcRenderer.invoke("promptGPT", promptGPT, model, key, baseURL);
  return result;
}

export { getTTSData, getDataGPT };

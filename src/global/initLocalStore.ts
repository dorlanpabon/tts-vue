// import { useI18n } from 'vue-i18n';
// const { t } = useI18n();  
import i18n from '@/assets/i18n/i18n';
import { voices } from './voices';
const Store = require("electron-store");
const store = new Store();
const { ipcRenderer } = require("electron");
const { t } = i18n.global;

export default async function initStore() {
  try {
    const msVoicesList = await ipcRenderer.invoke("voices");
    localStorage.setItem("msVoicesList", JSON.stringify(msVoicesList));
  } catch (error) {
    // 如果网络请求失败并且localStorage的msVoicesList为空
    if (localStorage.getItem("msVoicesList") == null) {
      localStorage.setItem("msVoicesList", JSON.stringify(voices));
    }
  }

  // Voz por defecto: Colombia es-CO.
  // Microsoft solo ofrece 2 voces neurales para es-CO (48 kHz, GA):
  // - es-CO-SalomeNeural (femenina): la mas natural y clara, default recomendado.
  // - es-CO-GonzaloNeural (masculina): alternativa masculina.
  // No existe variante "paisa": ambas usan acento colombiano neutro (estandar Bogota),
  // que es lo mas cercano disponible en Azure/Edge Speech.
  // Referencia: SecondaryLocales y LocaleDescription "es-CO" en src/global/voices.ts
  // (Salome id 6f1346c4 / Gonzalo id b53bcfc5). Nada de es-MX aqui a proposito.
  store.set("FormConfig.Colombia", {
    languageSelect: "es-CO",
    // Salome: mejor voz colombiana disponible (femenina, Neural).
    // Si prefieres voz masculina, cambia a "es-CO-GonzaloNeural".
    voiceSelect: "es-CO-SalomeNeural",
    voiceStyleSelect: "",
    role: "Default",
    speed: 1.0,
    pitch: 1.0,
    api: 1,
  });
  // Migracion: elimina la plantilla vieja en chino ("默认") para que el
  // desplegable ya no muestre caracteres sin traducir.
  try {
    if (store.has("FormConfig.默认")) {
      store.delete("FormConfig.默认");
    }
  } catch (e) {
    // ignora si electron-store no soporta delete en esta version
  }

  if (!store.has("language")) {
    store.set("language", "es");
  }
  // Sincroniza el idioma UI antes de generar textos dependientes de i18n,
  // para que la primera ejecucion ya arranque en espanol.
  try {
    (i18n.global.locale as any).value = store.get("language");
  } catch (e) {
    // i18n legacy fallback: ignora si no hay .value
  }
  
  if (!store.has("savePath")) {
    store.set("savePath", ipcRenderer.sendSync("getDesktopPath"));
  }
  if (!store.has("audition")) {
    store.set(
      "audition",
      t("initialLocalStore.audition")
    );
  }
  if (!store.has("autoplay")) {
    store.set("autoplay", true);
  }
  if (!store.has("updateNotification")) {
    store.set("updateNotification", true);
  }
  if (!store.has("titleStyle")) {
    store.set("titleStyle", true);
  }
  if (!store.has("speechKey")) {
    store.set("speechKey", "");
  }
  if (!store.has("serviceRegion") || !store.get("serviceRegion")) {
    // eastus: menor latencia desde Colombia y con todas las voces neurales.
    store.set("serviceRegion", "eastus");
  }
  if (!store.has("disclaimers")) {
    store.set("disclaimers", false);
  }
  if (!store.has("retryCount")) {
    store.set("retryCount", 10);
  }
  if (!store.has("retryInterval")) {
    store.set("retryInterval", 3);
  }
  // Proveedor IA: respeta a usuarios con clave OpenAI; nuevos van a OpenRouter (gratis).
  if (!store.has("aiProvider")) {
    store.set("aiProvider", store.get("openAIKey") ? "openai" : "openrouter");
  }
  if (!store.has("aiBaseUrl")) {
    store.set("aiBaseUrl", "");
  }
  // Modelo por defecto: gratis de OpenRouter para nuevos, o gpt-4o-mini en OpenAI.
  if (!store.has("gptModel")) {
    store.set(
      "gptModel",
      store.get("aiProvider") === "openrouter"
        ? "google/gemma-4-31b-it:free"
        : "gpt-4o-mini"
    );
  }
  // Limpieza: la ayuda de cuota ahora se muestra siempre (sin interruptor).
  try {
    if (store.has("quotaHelp")) {
      store.delete("quotaHelp");
    }
  } catch (e) {
    // ignora si electron-store no soporta delete en esta version
  }
}

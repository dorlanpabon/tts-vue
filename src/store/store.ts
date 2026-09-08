// @/store/firstStore.js

import { defineStore } from "pinia";
import { getTTSData, getDataGPT } from "./play";
import { AI_PROVIDER_BASE_URLS } from "@/types/prompGPT";
import { ElMessage, ElMessageBox } from "element-plus";
import { h } from "vue";
import i18n from "@/assets/i18n/i18n";
import { buildSsml } from "@/global/ssml";
import { getSecret, setSecret } from "@/global/secrets";
import { classifyTtsError, errText, isQuotaError } from "@/global/ttsErrors";
const { t } = i18n.global;
const fs = require("fs");
const path = require("path");
const Store = require("electron-store");
const { ipcRenderer } = require("electron");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const { Readable } = require('stream');

if (process.env.NODE_ENV === 'development') {
  // 处于开发状态
  console.log('开发状态');
  ffmpeg.setFfmpegPath(ffmpegInstaller.path);
} else if (process.env.NODE_ENV === 'production') {
  // 处于打包状态
  console.log('打包状态');
  ffmpeg.setFfmpegPath(ffmpegInstaller.path.replace("app.asar", "app.asar.unpacked"));
}

const store = new Store();

// Plantilla segura si el disco aun no tiene ninguna (primer arranque).
// Mismos valores que initLocalStore crea.
const DEFAULT_FORM_CONFIG = {
  languageSelect: "es-CO",
  voiceSelect: "es-CO-SalomeNeural",
  voiceStyleSelect: "",
  role: "Default",
  speed: 1.0,
  pitch: 1.0,
  api: 1,
};

// Mapea errores tecnicos de TTS a mensajes localizados para la UI.
// 429 = cuota gratuita agotada (verificado: Retry-After ~24h).
// 403 = endpoint gratuito denegando (issue #201 del repo original).
// azureFailed = fallo del fallback/conexion Azure (revisar clave y region).
// Sin dumps tecnicos crudos: solo texto legible.
function ttsErrorMessage(err: any, fallbackKey = "messages.convertFailed"): string {
  const kind = classifyTtsError(err);
  if (kind === "rateLimited") {
    return t("messages.rateLimited");
  }
  if (kind === "accessDenied") {
    return t("messages.accessDenied");
  }
  if (kind === "azureFailed") {
    return t("messages.azureAuthError");
  }
  const detail = errText(err).slice(0, 300);
  if (detail === "" || detail.startsWith("[object")) {
    return t(fallbackKey);
  }
  return `${t(fallbackKey)}\n${detail}`;
}

// Limpia prefijos tecnicos de errores IPC/SDK para mostrarlos en la UI.
function cleanGptError(err: any): string {
  return String((err && (err as any).message) || err)
    .replace(/^Error invoking remote method '[^']+':\s*/, "")
    .replace(/^Error:\s*/, "");
}

// Mensaje localizado para fallos de IA (sin texto tecnico crudo).
function gptErrorMessage(err: any): string {
  const s = errText(err);
  if (/(^|[^0-9])401([^0-9]|$)/.test(s) || /unauthorized|authentication/i.test(s)) {
    return t("messages.gptBadKey");
  }
  if (/provider returned error|overloaded|capacity|no endpoints/i.test(s) || /(^|[^0-9])5[0-9]{2}([^0-9]|$)/.test(s) || /(^|[^0-9])404([^0-9]|$)/.test(s)) {
    return t("messages.gptProviderDown");
  }
  if (/(^|[^0-9])429([^0-9]|$)/.test(s) || /rate.?limit/i.test(s)) {
    return t("messages.gptRateLimited");
  }
  if (/(^|[^0-9])402([^0-9]|$)/.test(s) || /payment|credits|insufficient/i.test(s)) {
    return t("messages.gptNoCredits");
  }
  return `${t("messages.gptFailed")}\n${cleanGptError(err)}`;
}

// Parte texto largo en trozos (logica original del modo lote).
function splitTextList(text: string): string[] {
  const delimiters = "，。？,.? ".split("");
  const maxSize = 300;
  const handler = text.split("").reduce(
    (obj: any, char: any, index: any) => {
      obj.buffer.push(char);
      if (delimiters.indexOf(char) >= 0) obj.end = index;
      if (obj.buffer.length === maxSize) {
        obj.res.push(
          obj.buffer.splice(0, obj.end + 1 - obj.offset).join("")
        );
        obj.offset += obj.res[obj.res.length - 1].length;
      }
      return obj;
    },
    {
      buffer: [],
      end: 0,
      offset: 0,
      res: [],
    }
  );
  handler.res.push(handler.buffer.join(""));
  return handler.res;
}

// Guia oficial de inicio rapido de Text-to-Speech, en el idioma de la UI.
export function azureGuideUrl(): string {
  const loc = String((i18n.global.locale as any).value || "es");
  if (loc.startsWith("zh")) {
    return "https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/get-started-text-to-speech";
  }
  if (loc.startsWith("es")) {
    return "https://learn.microsoft.com/es-es/azure/ai-services/speech-service/get-started-text-to-speech";
  }
  return "https://learn.microsoft.com/en-us/azure/ai-services/speech-service/get-started-text-to-speech";
}
// 定义并导出容器，第一个参数是容器id，必须唯一，用来将所有的容器
// 挂载到根容器上
export const useTtsStore = defineStore("ttsStore", {
  // 定义state，用来存储状态的
  state: () => {
    return {
      inputs: {
        inputValue: "¡Hola pues! ¿Cómo estás?\nProbando la mejor voz de Colombia.",
        ssmlValue: "¡Hola pues! ¿Cómo estás?\nProbando la mejor voz de Colombia.",
      },
      formConfig:
        store.get("FormConfig.Colombia") ||
        store.get("FormConfig.默认") ||
        DEFAULT_FORM_CONFIG,
      page: {
        asideIndex: "1",
        tabIndex: "1",
      },
      tableData: <any>[], // 文件列表的数据
      currConfigName: "Colombia", // 当前配置的名字
      config: {
        language: store.get("language"),
        formConfigJson: store.get("FormConfig"),
        formConfigList: <any>[],
        configLabel: <any>[],
        savePath: store.get("savePath"),
        audition: store.get("audition"),
        autoplay: store.get("autoplay"),
        updateNotification: store.get("updateNotification"),
        titleStyle: store.get("titleStyle"),
        api: store.get("api"),
        formatType: store.get("formatType"),
        speechKey: getSecret("speechKey"),
        serviceRegion: store.get("serviceRegion"),
        disclaimers: store.get("disclaimers"),
        retryCount: store.get("retryCount"),
        retryInterval: store.get("retryInterval"),
        openAIKey: getSecret("openAIKey"),
        gptModel: store.get("gptModel"),
        aiProvider: store.get("aiProvider"),
        aiBaseUrl: store.get("aiBaseUrl"),
        darkMode: store.get("darkMode", false),
      },
      isLoading: false,
      quotaHelpVisible: false,
      apiHealth: <any>{
        speech: null,
        edge: null,
        openrouter: null,
        zen: null,
      },
      healthChecking: false,
      history: <any>[],
      currMp3Buffer: Buffer.alloc(0),
      currMp3Url: "",
      audioPlayer: null,
    };
  },
  // 定义getters，类似于computed，具有缓存g功能
  getters: {},
  // 定义actions，类似于methods，用来修改state，做一些业务逻辑
  actions: {
    setDoneStatus(filePath: string) {
      for (const item of this.tableData) {
        if (item.filePath == filePath) {
          item.status = "done";
          return;
        }
      }
    },
    setSSMLValue(text = "") {
      if (text === "") text = this.inputs.inputValue;
      this.inputs.ssmlValue = buildSsml({
        voice: this.formConfig.voiceSelect,
        style: this.formConfig.voiceStyleSelect,
        role: this.formConfig.role,
        rate: (this.formConfig.speed - 1) * 100,
        pitch: (this.formConfig.pitch - 1) * 50,
        text,
      });
    },
    setSavePath() {
      store.set("savePath", this.config.savePath);
    },
    setLanguage() {
      store.set("language", this.config.language);
    },
    setAuditionConfig() {
      store.set("audition", this.config.audition);
    },
    updateNotificationChange() {
      store.set("updateNotification", this.config.updateNotification);
    },
    updateTitleStyle() {
      store.set("titleStyle", this.config.titleStyle);
    },
    setFormatType() {
      store.set("formatType", this.config.formatType);
    },
    setAutoPlay() {
      store.set("autoplay", this.config.autoplay);
    },
    setSpeechKey() {
      setSecret("speechKey", this.config.speechKey);
    },
    setOpenAIKey() {
      setSecret("openAIKey", this.config.openAIKey);
    },
    setGPTModel() {
      store.set("gptModel", this.config.gptModel);
    },
    setAiProvider() {
      store.set("aiProvider", this.config.aiProvider);
      // Al cambiar de proveedor (no personalizado) se autocompleta su URL base.
      if (this.config.aiProvider !== "custom") {
        this.config.aiBaseUrl = AI_PROVIDER_BASE_URLS[this.config.aiProvider] || "";
        store.set("aiBaseUrl", this.config.aiBaseUrl);
      }
    },
    setAiBaseUrl() {
      store.set("aiBaseUrl", this.config.aiBaseUrl);
    },
    updateDarkMode() {
      store.set("darkMode", this.config.darkMode);
      try {
        document.documentElement.classList.toggle("dark", !!this.config.darkMode);
      } catch (e) {
        // entorno sin DOM
      }
    },
    setServiceRegion() {
      store.set("serviceRegion", this.config.serviceRegion);
    },
    setRetryCount() {
      store.set("retryCount", parseInt(this.config.retryCount));
    },
    setRetryInterval() {
      store.set("retryInterval", parseInt(this.config.retryInterval));
    },
    addFormConfig() {
      this.config.formConfigJson[this.currConfigName] = this.formConfig;
      this.genFormConfig();
    },
    genFormConfig() {
      // store.set("FormConfig", this.config.formConfigJson);
      this.config.formConfigList = Object.keys(this.config.formConfigJson).map(
        (item) => ({
          tagName: item,
          content: this.config.formConfigJson[item],
        })
      );
      this.config.configLabel = Object.keys(this.config.formConfigJson).map(
        (item) => ({
          value: item,
          label: item,
        })
      );
    },
    async startChatGPT(promptGPT: string) {
      // URL base efectiva: la personalizada, o la del proveedor, u OpenAI.
      const baseURL =
        this.config.aiBaseUrl ||
        AI_PROVIDER_BASE_URLS[this.config.aiProvider] ||
        AI_PROVIDER_BASE_URLS.openai;
      // Sin clave (salvo endpoint local) no se llama: mensaje claro en vez
      // del 401 crudo ("Missing Authentication header").
      if (this.config.aiProvider !== "custom" && !this.config.openAIKey) {
        ElMessage({
          message: t("messages.gptNoKey"),
          type: "warning",
          duration: 5000,
        });
        return;
      }
      await getDataGPT(
        {
          promptGPT: promptGPT,
          key: this.config.openAIKey,
          model: this.config.gptModel,
          baseURL: baseURL,
          retryCount: this.config.retryCount,
          retryInterval: this.config.retryInterval,
        }
      )
        .then((res: any) => {
          this.inputs.inputValue = res;
          this.setSSMLValue();
          console.log(res);
          ElMessage({
            message: t("messages.gptSuccess"),
            type: "success",
            duration: 2000,
          });
          // this.start();
        })
        .catch((err: any) => {
          console.error(err);
          ElMessage({
            message: gptErrorMessage(err),
            type: "error",
            duration: 5000,
          });
        });
    },
    async start() {
      console.log("清空缓存中");
      let resFlag = true;
      this.currMp3Buffer = Buffer.alloc(0);
      this.currMp3Url = "";
      // this.page.asideIndex == "1"单文本转换
      if (this.page.asideIndex == "1") {
        this.currMp3Url = "";
        const value = {
          activeIndex: this.page.tabIndex,
          inputValue:
            this.page.tabIndex == "1"
              ? this.inputs.inputValue
              : this.inputs.ssmlValue,
        };
        if (
          this.page.tabIndex == "1" &&
          Number(this.formConfig.api) === 1 &&
          this.inputs.inputValue.length > 400
        ) {
          const delimiters = ["，", "。", "？", ",", ".", "?", "\n"];
          const maxSize = 300;
          ipcRenderer.send("log.info", "字数过多，正在对文本切片。。。");

          const textHandler = this.inputs.inputValue.split("").reduce(
            (obj: any, char, index, arr) => {
              obj.buffer.push(char);
              if (delimiters.indexOf(char) >= 0) obj.end = index;
              if (obj.buffer.length === maxSize) {
                obj.res.push(
                  obj.buffer.splice(0, obj.end + 1 - obj.offset).join("")
                );
                obj.offset += obj.res[obj.res.length - 1].length;
              }
              return obj;
            },
            {
              buffer: [],
              end: 0,
              offset: 0,
              res: [],
            }
          );
          textHandler.res.push(textHandler.buffer.join(""));
          const tasks = textHandler.res;
          for (let index = 0; index < tasks.length; index++) {
            try {
              ipcRenderer.send(
                "log.info",
                `正在执行第${index + 1}次转换。。。`
              );
              const element = tasks[index];
              value.inputValue = element;
              const buffers: any = await getTTSData(
                value,
                this.formConfig.voiceSelect,
                this.formConfig.voiceStyleSelect,
                this.formConfig.role,
                (this.formConfig.speed - 1) * 100,
                (this.formConfig.pitch - 1) * 50,
                this.formConfig.api,
                this.config.speechKey,
                this.config.serviceRegion,
                this.config.retryCount,
              );
              this.currMp3Buffer = Buffer.concat([this.currMp3Buffer, buffers]);
              ipcRenderer.send(
                "log.info",
                `第${index + 1}次转换完成，此时Buffer长度为：${this.currMp3Buffer.length
                }`
              );
            } catch (error) {
              resFlag = false;
              console.error(error);
              ipcRenderer.send("log.error", error);
              this.isLoading = false;
              this.showQuotaHelpOrMessage(error, "messages.networkError");
              if (this.currMp3Buffer.length > 0) {
                const svlob = new Blob([this.currMp3Buffer]);
                this.currMp3Url = URL.createObjectURL(svlob);
              }
              return;
            }
          }

          if (this.currMp3Buffer.length > 0) {
            const svlob = new Blob([this.currMp3Buffer]);
            this.currMp3Url = URL.createObjectURL(svlob);
          }
          this.isLoading = false;
        } else {
          // 字数少直接转换
          await getTTSData(
            value,
            this.formConfig.voiceSelect,
            this.formConfig.voiceStyleSelect,
            this.formConfig.role,
            (this.formConfig.speed - 1) * 100,
            (this.formConfig.pitch - 1) * 50,
            this.formConfig.api,
            this.config.speechKey,
            this.config.serviceRegion,
            this.config.retryCount,
          )
            .then((mp3buffer: any) => {
              this.currMp3Buffer = mp3buffer;
              const svlob = new Blob([mp3buffer]);
              this.currMp3Url = URL.createObjectURL(svlob);
              this.isLoading = false;
            })
            .catch((err) => {
              resFlag = false;
              this.isLoading = false;
              console.error(err);
              this.showQuotaHelpOrMessage(err);
            });
        }
        if (resFlag) {
          this.addHistory(this.inputs.inputValue);
          ElMessage({
            message: this.config.autoplay
              ? t("messages.successPlaying")
              : t("messages.successManual"),
            type: "success",
            duration: 2000,
          });
        }

        ipcRenderer.send("log.info", `转换完成`);
      } else {
        // this.page.asideIndex == "2" 批量转换: secuencial, archivo por archivo.
        // (antes forEach async disparaba todo en paralelo y perdia errores/estado).
        this.page.tabIndex = "1";

        let doneCount = 0;
        let failCount = 0;
        for (const item of this.tableData) {
          const inps = {
            activeIndex: 1, // 值转换普通文本
            inputValue: "",
            tableValue: item,
          };
          const filePath = path.join(
            this.config.savePath,
            item.fileName.split(path.extname(item.fileName))[0] + ".mp3"
          );
          try {
            const datastr: string = await fs.promises.readFile(item.filePath, "utf8");
            const tasks =
              datastr.length > 400 && Number(this.formConfig.api) === 1
                ? splitTextList(datastr)
                : [datastr];
            let buffer = Buffer.alloc(0);
            for (let index = 0; index < tasks.length; index++) {
              ipcRenderer.send(
                "log.info",
                `lote ${item.fileName}: parte ${index + 1}/${tasks.length}`
              );
              inps.inputValue = tasks[index];
              const buffers: any = await getTTSData(
                inps,
                this.formConfig.voiceSelect,
                this.formConfig.voiceStyleSelect,
                this.formConfig.role,
                (this.formConfig.speed - 1) * 100,
                (this.formConfig.pitch - 1) * 50,
                this.formConfig.api,
                this.config.speechKey,
                this.config.serviceRegion,
                this.config.retryCount,
              );
              buffer = Buffer.concat([buffer, buffers]);
            }
            fs.writeFileSync(filePath, buffer);
            this.setDoneStatus(item.filePath);
            this.addHistory(datastr);
            doneCount++;
          } catch (error) {
            console.error(error);
            ipcRenderer.send("log.error", error);
            failCount++;
            this.showQuotaHelpOrMessage(error);
            // Sin cuota no tiene sentido seguir quemando el resto de archivos.
            if (isQuotaError(error)) break;
          }
        }
        this.isLoading = false;
        if (failCount === 0 && doneCount > 0) {
          ElMessage({
            message: t("messages.batchDone").replace("{done}", String(doneCount)),
            type: "success",
            duration: 3000,
          });
        } else if (failCount > 0 && doneCount > 0) {
          ElMessage({
            message: t("messages.batchPartial")
              .replace("{done}", String(doneCount))
              .replace("{failed}", String(failCount)),
            type: "warning",
            duration: 4000,
          });
        }
        ipcRenderer.send("log.info", `lote terminado: ${doneCount} ok, ${failCount} fallos`);
      }
    },
    writeFileSync() {
      const currTime = new Date().getTime().toString();

      console.log('当前设置的格式:', this.config.formatType);

      //-------------------------------------------------------------------------------------------------------------------------------------

      const filePath = path.join(this.config.savePath, currTime + this.config.formatType);
      if (this.config.formatType == ".mp3") {
        fs.writeFileSync(path.resolve(filePath), this.currMp3Buffer);
        ElMessage({
          dangerouslyUseHTMLString: true,
          message: h("p", null, [
            h("span", null, t("messages.downloadDone")),
            h(
              "span",
              {
                on: {
                  click: this.showItemInFolder(filePath),
                },
              },
              filePath
            ),
          ]),
          type: "success",
          duration: 4000,
        });
        ipcRenderer.send("log.info", `${t("messages.downloadDone")}${filePath}`);
      }
      else {
        // 将 this.currMp3Buffer 转换为可读流
        const inputStream = new Readable();
        inputStream.push(this.currMp3Buffer);
        inputStream.push(null); // 结束流
        // 使用 fluent-ffmpeg 进行转码
        ffmpeg(inputStream)
          .output(filePath)
          .audioCodec('pcm_s16le') // 示例：使用 PCM 16位音频编码
          .audioChannels(2) // 示例：设置音频通道数为2
          .audioFrequency(44100) // 示例：设置音频采样率为44100Hz
          .on('end', () => {
            console.log('Transcode done, saved to:', filePath);
            ipcRenderer.send("showItemInFolder", filePath);

            ElMessage({
              dangerouslyUseHTMLString: true,
              message: h("p", null, [
                h("span", null, t("messages.downloadDone")),
                h(
                  "span",
                  {
                    on: {
                      click: this.showItemInFolder(filePath),
                    },
                  },
                  filePath
                ),
              ]),
              type: "success",
              duration: 4000,
            });

          })
          .on('error', (err: any) => {
            console.error('Transcode error:', err);

            ElMessage({
              dangerouslyUseHTMLString: true,
              message: h("p", null, [
                h("span", null, t("messages.transcodeFailed") + err)
              ]),
              type: "error",
              duration: 10000,
            });

          })
          .run();
      }
      //-------------------------------------------------------------------------------------------------------------------------------------

    },
    async audition(val: string) {
      const inps = {
        activeIndex: 1, // 值转换普通文本
        inputValue: this.config.audition,
      };
      await getTTSData(
        inps,
        val,
        this.formConfig.voiceStyleSelect,
        this.formConfig.role,
        (this.formConfig.speed - 1) * 100,
        (this.formConfig.pitch - 1) * 50,
        this.formConfig.api,
        this.config.speechKey,
        this.config.serviceRegion,
        this.config.retryCount,
      )
        .then((mp3buffer: any) => {
          this.currMp3Buffer = mp3buffer;
          const svlob = new Blob([mp3buffer]);
          const sound = new Audio(URL.createObjectURL(svlob));
          sound.play();
        })
        .catch((err: any) => {
          this.showQuotaHelpOrMessage(err);
        });
    },
    showItemInFolder(filePath: string) {
      ipcRenderer.send("showItemInFolder", filePath);
    },
    // Semáforo de APIs sin gastar cuota (ver electron/utils/health.ts).
    async refreshHealth() {
      this.healthChecking = true;
      try {
        const report: any = await ipcRenderer.invoke("health");
        this.apiHealth = report;
      } catch (err) {
        console.error(err);
      }
      this.healthChecking = false;
    },
    // Historial local (max 30): texto capado para reusar.
    loadHistory() {
      try {
        const h = store.get("history");
        this.history = Array.isArray(h) ? h : [];
      } catch (e) {
        this.history = [];
      }
    },
    addHistory(text: string) {
      try {
        const entry = {
          time: Date.now(),
          text: String(text || "").slice(0, 2000),
          chars: String(text || "").length,
          voice: this.formConfig.voiceSelect,
        };
        this.history.unshift(entry);
        this.history = this.history.slice(0, 30);
        store.set("history", this.history);
      } catch (e) {
        console.error(e);
      }
    },
    reuseHistory(item: any) {
      this.inputs.inputValue = item.text;
      this.setSSMLValue();
      this.page.asideIndex = "1";
    },
    clearHistory() {
      this.history = [];
      store.set("history", []);
    },
    // Modal de ayuda de cuota (paso a paso con hipervinculos): aparece SIEMPRE
    // que el fallo es por 429/403. Sin interruptor.
    showQuotaHelpOrMessage(err: any, fallbackKey = "messages.convertFailed") {
      if (isQuotaError(err)) {
        this.quotaHelpVisible = true;
      } else {
        ElMessage({
          message: ttsErrorMessage(err, fallbackKey),
          type: "error",
          duration: 4000,
        });
      }
    },
    showDisclaimers() {
      if (!this.config.disclaimers) {
        ElMessageBox.confirm(
          t("disclaimer.text"),
          t("disclaimer.title"),
          {
            confirmButtonText: t("disclaimer.confirm"),
            cancelButtonText: t("disclaimer.cancel"),
            type: "warning"
          }
        ).then(() => {
          store.set("disclaimers", true);
        });
      }
    }
  },
});

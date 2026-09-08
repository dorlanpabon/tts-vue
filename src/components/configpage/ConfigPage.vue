<template>
  <div class="config-page">
    <div class="config-side" label-position="right">
      <el-form :model="config" >
        <el-form-item :label="t('configPage.language')">
          <el-select
            v-model="config.language"
            size="small"
            class="input-path"
            @change="saveLanguageConfig"
          >
            <el-option
              v-for="lang in languages"
              :key="lang.value"
              :label="lang.label"
              :value="lang.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('configPage.downloadPath')">
          <el-input
            v-model="config.savePath"
            size="small"
            class="input-path"
            @click="openFolderSelector"
          >
            <template #append>
              <el-button type="primary" @click="savePathConfig">{{ t('configPage.confirm') }}</el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item :label="t('configPage.retryCount')">
            <el-input
              type="number"
              v-model="config.retryCount"
              min="1"
              size="small"
              class="input-path"
              @change="setRetryCount"
              />
        </el-form-item>
        <el-form-item :label="t('configPage.retryInterval')">
            <el-input
              type="number"
              v-model="config.retryInterval"
              min="0"
              size="small"
              class="input-path"
              @change="setRetryInterval"
              />
        </el-form-item>
        <el-form-item :label="t('configPage.speechKey')">
            <el-input
              v-model="config.speechKey"
              size="small"
              class="input-path"
              @change="setSpeechKey"
              />
        </el-form-item>
        <el-form-item :label="t('configPage.serviceRegion')">
            <el-input
              v-model="config.serviceRegion"
              size="small"
              class="input-path"
              @change="setServiceRegion"
              :placeholder="t('configPage.serviceRegionPlaceHolder')"
              />
        </el-form-item>
        <el-form-item :label="t('configPage.aiProvider')">
          <el-select
            v-model="config.aiProvider"
            size="small"
            class="input-path"
            @change="setAIProvider"
          >
            <el-option
              v-for="prov in aiProviders"
              :key="prov.value"
              :label="prov.label"
              :value="prov.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('configPage.aiBaseUrl')">
          <el-input
            v-model="config.aiBaseUrl"
            size="small"
            class="input-path"
            :placeholder="aiBaseUrlPlaceholder"
            @change="setAIBaseUrl"
            />
        </el-form-item>
        <el-form-item :label="t('configPage.openAIKey')">
            <el-input
              v-model="config.openAIKey"
              size="small"
              class="input-path"
              @change="setOpenAIKey"
              />
        </el-form-item>
        <div class="ai-hint" @click="openOpenRouterKeys">{{ t('configPage.aiKeyHint') }}</div>
        <el-form-item :label="t('configPage.gptModel')">
          <el-select
            v-model="config.gptModel"
            size="small"
            class="input-path"
            filterable
            allow-create
            default-first-option
            @change="setGPTModel"
          >
            <el-option-group
              v-for="group in gptModelGroups"
              :key="group.label"
              :label="group.label"
            >
              <el-option
                v-for="model in group.items"
                :key="model.value"
                :label="model.label"
                :value="model.value"
              ></el-option>
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('configPage.autoplay')">
          <el-switch
            v-model="config.autoplay"
            :active-text="t('configPage.yes')"
            :inactive-text="t('configPage.no')"
            inline-prompt
            @change="switchChange"
          />
        </el-form-item>
        <el-form-item :label="t('configPage.updateNotification')">
          <el-switch
            v-model="config.updateNotification"
            :active-text="t('configPage.yes')"
            :inactive-text="t('configPage.no')"
            inline-prompt
            @change="updateNotificationChange"
          />
        </el-form-item>
        <el-form-item :label="t('configPage.titleStyle')">
          <el-switch
            v-model="config.titleStyle"
            active-text="MacOS"
            inactive-text="Windows"
            @change="updateTitleStyle"
          />
        </el-form-item>
        <el-form-item :label="t('configPage.darkMode')">
          <el-switch
            v-model="config.darkMode"
            :active-text="t('configPage.yes')"
            :inactive-text="t('configPage.no')"
            inline-prompt
            @change="updateDarkMode"
          />
        </el-form-item>
        <el-form-item :label="t('health.title')">
          <div class="health-rows">
            <div v-for="row in healthRows" :key="row.key" class="health-row">
              <span class="health-name">{{ row.name }}</span>
              <el-tag :type="row.tag" size="small">{{ row.status }}</el-tag>
              <span class="health-detail">{{ row.detail }}</span>
            </div>
            <el-button size="small" :loading="healthChecking" @click="refreshHealth">{{ t('health.refresh') }}</el-button>
          </div>
        </el-form-item>
        <el-form-item :label="t('configPage.auditionText')">
          <el-input v-model="config.audition" size="small" class="input-path">
            <template #append>
              <el-button type="primary" @click="auditionConfig">{{ t('configPage.confirm') }}</el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item :label="t('configPage.templateEdit')">
          <el-table
            :data="config.formConfigList"
            style="width: 100%"
            height="calc(100vh - 560px)"
          >
          <el-table-column :prop="t('configPage.name')" :label="t('configPage.name')">
              <template #default="scope">
                <el-popover
                  effect="light"
                  trigger="hover"
                  placement="top"
                  width="auto"
                >
                  <template #default>
                    <!-- <div>语言: {{ scope.row.content.languageSelect }}</div>
                    <div>语音: {{ scope.row.content.voiceSelect }}</div>
                    <div>风格: {{ scope.row.content.voiceStyleSelect }}</div>
                    <div>角色: {{ scope.row.content.role }}</div>
                    <div>语速: {{ scope.row.content.speed }}</div>
                    <div>音调: {{ scope.row.content.pitch }}</div> -->
                    <div>{{ t('configPage.language') }}: {{ scope.row.content.languageSelect }}</div>
                    <div>{{ t('configPage.voice') }}: {{ scope.row.content.voiceSelect }}</div>
                    <div>{{ t('configPage.style') }}: {{ scope.row.content.voiceStyleSelect }}</div>
                    <div>{{ t('configPage.role') }}: {{ scope.row.content.role }}</div>
                    <div>{{ t('configPage.speed') }}: {{ scope.row.content.speed }}</div>
                    <div>{{ t('configPage.pitch') }}: {{ scope.row.content.pitch }}</div>

                  </template>
                  <template #reference>
                    <el-tag>{{ scope.row.tagName }}</el-tag>
                  </template>
                </el-popover>
              </template>
            </el-table-column>
            <el-table-column :label="t('configPage.action')">
              <template #default="scope">
                <el-button
                  size="small"
                  type="danger"
                  @click="handleDelete(scope.$index, scope.row)"
                  >{{ t('configPage.remove') }}</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
        <el-form-item :label="t('history.title')">
          <el-table
            :data="history"
            style="width: 100%"
            height="180"
            :empty-text="t('history.empty')"
          >
            <el-table-column :label="t('history.time')" width="150">
              <template #default="scope">
                {{ new Date(scope.row.time).toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="voice" :label="t('history.voice')" show-overflow-tooltip />
            <el-table-column prop="chars" :label="t('history.chars')" width="90" />
            <el-table-column :label="t('configPage.action')" width="110">
              <template #default="scope">
                <el-button size="small" @click="reuseHistoryItem(scope.row)">{{ t('history.reuse') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div style="margin-top: 4px;">
            <el-button size="small" type="danger" @click="clearHistoryAll">{{ t('history.clear') }}</el-button>
          </div>
        </el-form-item>
        <el-form-item class="btns">
          <el-button type="primary" @click="ipcRenderer.send('reload')"
            ><el-icon><Refresh /></el-icon>{{ t('configPage.refreshConfig') }}</el-button
          >
          <el-button type="warning" @click="openConfigFile"
            ><el-icon><Document /></el-icon>{{ t('configPage.configFile') }}</el-button
          >
          <el-dropdown split-button type="success" @click="openLogs">
            <el-icon><Finished /></el-icon>{{ t('configPage.openLogs') }}
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="openLogFolder"
                  ><el-icon><FolderDelete /></el-icon>{{ t('configPage.clearLogs') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-form-item>
      </el-form>

      <Donate class="donate"></Donate>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { useTtsStore } from "@/store/store";
import { storeToRefs } from "pinia";
import Donate from "./Donate.vue";
import { useI18n } from 'vue-i18n';
import i18n from "@/assets/i18n/i18n";
import { AI_PROVIDER_BASE_URLS } from "@/types/prompGPT";
import { OPENROUTER_FREE_MODELS, ZEN_FREE_MODELS } from "@/global/aiModels";
import { computed } from "vue";
const { t } = useI18n();  

const { ipcRenderer, shell } = require("electron");

const Store = require("electron-store");
const store = new Store();

const ttsStore = useTtsStore();
const { config, apiHealth, healthChecking, history } = storeToRefs(ttsStore);

const healthRows = computed(() => {
  const defs = [
    { key: 'speech', name: 'Microsoft' },
    { key: 'edge', name: 'Edge' },
    { key: 'openrouter', name: 'OpenRouter' },
    { key: 'zen', name: 'OpenCode Zen' },
  ];
  return defs.map((d) => {
    const h: any = (apiHealth.value as any)[d.key];
    if (!h) {
      return { ...d, tag: 'info', status: t('health.checking'), detail: '' };
    }
    return {
      ...d,
      tag: h.ok ? 'success' : 'danger',
      status: h.ok ? t('health.ok') : t('health.fail'),
      detail: h.ms != null ? `${h.detail} · ${h.ms}ms` : h.detail,
    };
  });
});

const refreshHealth = () => {
  ttsStore.refreshHealth();
};

const reuseHistoryItem = (row: any) => {
  ttsStore.reuseHistory(row);
  successMessage();
};

const clearHistoryAll = () => {
  ttsStore.clearHistory();
};


const languages = [
  // Agrega más idiomas según sea necesario
  
  { label: 'English', value: 'en' },
  { label: 'Español', value: 'es' },
  { label: '中文', value: 'zh' },
];

const aiProviders = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'OpenRouter', value: 'openrouter' },
  { label: 'OpenCode Zen', value: 'zen' },
  { label: t('configPage.aiCustom'), value: 'custom' },
];

// Placeholder de la URL base: la del proveedor elegido.
const aiBaseUrlPlaceholder = computed(() => {
  return AI_PROVIDER_BASE_URLS[config.value.aiProvider] || AI_PROVIDER_BASE_URLS.openai;
});

// Modelos OpenAI vigentes + gratuitos verificados (ver src/global/aiModels.ts).
// El desplegable permite crear/escribir otros (los :free rotan).
const gptModelGroups = [
  {
    label: 'OpenCode Zen (gratis)',
    items: ZEN_FREE_MODELS.map((m) => ({ label: m.label, value: m.id })),
  },
  {
    label: 'OpenRouter (gratis)',
    items: OPENROUTER_FREE_MODELS.map((m) => ({ label: m.label, value: m.id })),
  },
  {
    label: 'OpenAI',
    items: [
      { label: 'GPT-4o mini', value: 'gpt-4o-mini'},
      { label: 'GPT-4o', value: 'gpt-4o'},
      { label: 'GPT-4.1 mini', value: 'gpt-4.1-mini'},
      { label: 'GPT-4.1', value: 'gpt-4.1'},
    ],
  },
  // Agrega más modelos según sea necesario (o escríbelos directamente: permite crear)
];

const saveLanguageConfig = () => {
  // Actualiza el idioma en i18n y guarda la configuración
  i18n.global.locale.value = config.value.language;
  ttsStore.setLanguage();
  successMessage();
};


const openFolderSelector = async () => {
  const path = await ipcRenderer.invoke("openFolderSelector");
  if (path) {
    config.value.savePath = path[0];
  }
};

const successMessage = () => {
  ElMessage({
    message: t('configPage.saveApplied'),
    type: "success",
    duration: 2000,
  });
};

const handleDelete = (index: any, row: any) => {
  delete config.value.formConfigJson[row.tagName];
  store.set("FormConfig", config.value.formConfigJson);
  ttsStore.genFormConfig();

  ElMessage({
    message: t('configPage.deleteSuccess'),
    type: "success",
    duration: 2000,
  });
};

const openConfigFile = () => {
  shell.openPath(store.path);
};

const openLogs = () => {
  ipcRenderer.send("openLogs");
};

const openLogFolder = () => {
  ipcRenderer.send("openLogFolder");
  ElMessage({
    message: t('configPage.openLogFolderHint'),
    type: "error",
    duration: 10000,
  });
};

const savePathConfig = () => {
  ttsStore.setSavePath();
  successMessage();
};

const auditionConfig = () => {
  ttsStore.setAuditionConfig();
  successMessage();
};

const switchChange = () => {
  ttsStore.setAutoPlay();
  successMessage();
};

const updateNotificationChange = () => {
  ttsStore.updateNotificationChange();
  successMessage();
};

const updateTitleStyle = () => {
  ttsStore.updateTitleStyle();
  successMessage();
};

const updateDarkMode = () => {
  ttsStore.updateDarkMode();
  successMessage();
};

const setSpeechKey = () => {
  ttsStore.setSpeechKey();
  successMessage();
};

const setServiceRegion = () => {
  ttsStore.setServiceRegion();
  successMessage();
};

const setOpenAIKey = () => {
  ttsStore.setOpenAIKey();
  successMessage();
};

const setAIProvider = () => {
  ttsStore.setAiProvider();
  successMessage();
};

const setAIBaseUrl = () => {
  ttsStore.setAiBaseUrl();
  successMessage();
};

const openOpenRouterKeys = () => {
  shell.openExternal("https://openrouter.ai/keys");
};

const setGPTModel = () => {
  ttsStore.setGPTModel();
  successMessage();
};

const setRetryCount = () => {
  if (config.value.retryCount == '' || config.value.retryCount < 0) {
    config.value.retryCount = 1;
  }
  ttsStore.setRetryCount();
  successMessage();
};

const setRetryInterval = () => {
  if (config.value.retryInterval== '' || config.value.retryInterval < 0) {
    config.value.retryInterval = 0;
  }
  ttsStore.setRetryInterval();
  successMessage();
};
</script>

<style scoped>
.config-page {
  display: flex;
  flex-direction: row;
  padding: 10px;
  height: 97%;
}
.config-side {
  width: 100%;
  display: flex;
  justify-content: space-around;
}
.donate {
  width: 420px;
}
.el-form {
  margin-top: 7px;
  border-right: 1px solid #dcdfe6;
  width: calc(100% - 395px);
  padding-left: 10px;
  overflow-x: hidden;
}
:deep(.input-path .el-input-group__append) {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  line-height: 1;
  height: 32px;
  white-space: nowrap;
  cursor: pointer;
  color: #fff;
  text-align: center;
  box-sizing: border-box;
  outline: 0;
  transition: 0.1s;
  font-weight: 500;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  vertical-align: middle;
  -webkit-appearance: none;
  background-color: #409eff;
  border-color: #409eff;
  padding: 8px 15px;
  font-size: 14px;
  border-radius: 4px;
}
:deep(.el-table .el-table__cell) {
  padding: 3px 0 !important;
}
.el-form-item {
  width: 37vw;
  margin-bottom: 8px;
}
.ai-hint {
  width: 37vw;
  margin: -4px 0 8px 0;
  font-size: 12px;
  color: #409eff;
  cursor: pointer;
}
.ai-hint:hover {
  text-decoration: underline;
}
.health-rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}
.health-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.health-name {
  min-width: 90px;
  font-weight: 500;
}
.health-detail {
  color: #909399;
}
.btns {
  width: 100%;
  box-sizing: border-box;
  padding-right: 2px;
}
:deep(.btns .el-form-item__content) {
  justify-content: space-between;
}
.el-button + .el-button {
  margin-left: 0;
}
</style>

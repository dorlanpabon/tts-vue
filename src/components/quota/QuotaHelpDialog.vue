<template>
  <el-dialog
    v-model="quotaHelpVisible"
    :title="t('quota.title')"
    width="540px"
    :close-on-click-modal="false"
  >
    <p class="q-intro">{{ t('quota.intro') }}</p>
    <ol class="q-steps">
      <li>
        <b>{{ t('quota.s1t') }}</b><br />
        {{ t('quota.s1d') }}
        <el-link type="primary" @click="openFree">{{ t('quota.freeBtn') }}</el-link>
      </li>
      <li>
        <b>{{ t('quota.s2t') }}</b><br />
        {{ t('quota.s2d') }}
      </li>
      <li>
        <b>{{ t('quota.s3t') }}</b><br />
        {{ t('quota.s3d') }}
      </li>
      <li>
        <b>{{ t('quota.s4t') }}</b><br />
        {{ t('quota.s4d') }}<br />
        <code class="q-ex">{{ t('quota.example') }}</code>
      </li>
      <li>
        <b>{{ t('quota.s5t') }}</b><br />
        {{ t('quota.s5d') }}
      </li>
    </ol>
    <template #footer>
      <span class="q-footer">
        <el-button size="small" @click="openPortal">{{ t('quota.portalBtn') }}</el-button>
        <el-button size="small" @click="openGuide">{{ t('quota.guideBtn') }}</el-button>
        <el-button size="small" type="primary" @click="goSettings">{{ t('quota.settingsBtn') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useTtsStore } from "@/store/store";
import { storeToRefs } from "pinia";
import { azureGuideUrl } from "@/store/store";
const { t } = useI18n();
const { shell } = require("electron");

const ttsStore = useTtsStore();
const { quotaHelpVisible, page } = storeToRefs(ttsStore);

const openFree = () => {
  shell.openExternal("https://azure.microsoft.com/free/");
};
const openPortal = () => {
  shell.openExternal("https://portal.azure.com/#create/Microsoft.CognitiveServicesSpeechServices");
};
const openGuide = () => {
  shell.openExternal(azureGuideUrl());
};
const goSettings = () => {
  quotaHelpVisible.value = false;
  page.value.asideIndex = "3";
};
</script>

<style scoped>
.q-intro {
  margin: 0 0 8px 0;
  font-size: 13px;
  line-height: 1.5;
}
.q-steps {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  line-height: 1.55;
}
.q-steps li {
  margin-bottom: 8px;
}
.q-ex {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: #f2f3f5;
  font-size: 12px;
}
.q-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}
</style>

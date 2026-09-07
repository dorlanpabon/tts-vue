<template>
  <div class="donate">
    <div class="des">
      <h3>{{ t('donate.appreciation') }}</h3>
      <h3>
        {{ t('donate.encouragement') }}
      </h3>
      <p style="margin: 0 10px; font-size: 11px">
        <p>{{ t('donate.guideReminder') }}</p>
        <p>{{ t('donate.feedback') }}</p>
      </p>
    </div>

    <div class="fork-card">
      <div class="fork-row">
        <el-button type="primary" size="small" @click="openFork">
          <el-icon><Star /></el-icon>{{ t('donate.viewFork') }}
        </el-button>
        <el-button type="success" size="small" @click="openReleases">
          <el-icon><Download /></el-icon>{{ t('donate.downloadRelease') }}
        </el-button>
        <el-button type="warning" size="small" @click="openAzureGuide">
          <el-icon><Key /></el-icon>{{ t('donate.azureGuide') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const { shell } = require("electron");

const openFork = () => {
  shell.openExternal("https://github.com/dorlanpabon/tts-vue");
};
const openReleases = () => {
  shell.openExternal("https://github.com/dorlanpabon/tts-vue/releases/latest");
};
const openAzureGuide = () => {
  shell.openExternal("https://learn.microsoft.com/es-es/azure/ai-services/speech-service/get-started-text-to-speech");
};
</script>

<style scoped>
.donate {
  width: 400px;
  margin-bottom: 1px;
}
.donate .des {
  margin-bottom: 10px;
}
h3 {
  margin: 1px 10px;
  font-size: 1em;
}
.des p {
  margin: 0;
}
.fork-card {
  margin: 10px;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background-color: #f8fafc;
}
.fork-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.fork-row .el-button {
  margin-left: 0;
  justify-content: flex-start;
}
</style>

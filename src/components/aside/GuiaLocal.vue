<template>
  <div class="guia">
    <h2>{{ t('guide.title') }}</h2>
    <p class="g-intro">{{ t('guide.intro') }}</p>
    <ol class="g-steps">
      <li><b>{{ t('guide.s1t') }}</b><br />{{ t('guide.s1d') }}</li>
      <li><b>{{ t('guide.s2t') }}</b><br />{{ t('guide.s2d') }}</li>
      <li><b>{{ t('guide.s3t') }}</b><br />{{ t('guide.s3d') }}</li>
      <li><b>{{ t('guide.s4t') }}</b><br />{{ t('guide.s4d') }}</li>
    </ol>
    <h3>{{ t('guide.faqTitle') }}</h3>
    <p><b>429</b> — {{ t('guide.faq429') }}</p>
    <p><b>403</b> — {{ t('guide.faq403') }}</p>
    <p><b>F9</b> — {{ t('guide.faqF9') }}</p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>

<style scoped>
.guia {
  height: 100%;
  overflow-y: auto;
  padding: 16px 20px;
  font-size: 13px;
  line-height: 1.6;
}
.guia h2 {
  margin-top: 0;
}
.g-intro {
  color: #606266;
}
.g-steps {
  padding-left: 20px;
}
.g-steps li {
  margin-bottom: 8px;
}
</style>

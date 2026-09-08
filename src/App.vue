<script setup lang="ts">
import { useTtsStore } from "@/store/store";
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import Header from "./components/header/Header.vue";
import Aside from "./components/aside/Aside.vue";
import Main from "./components/main/Main.vue";
import Footer from "./components/footer/Footer.vue";
import QuotaHelpDialog from "./components/quota/QuotaHelpDialog.vue";
const ttsStore = useTtsStore();
ttsStore.genFormConfig();
ttsStore.setSSMLValue();
ttsStore.showDisclaimers();
ttsStore.loadHistory();
ttsStore.refreshHealth();
</script>

<template>
  <div class="app">
    <el-container>
      <el-header><Header /></el-header>
      <el-container class="container">
        <el-aside><Aside /></el-aside>
        <el-container class="main-footer">
          <el-main><Main /></el-main>
          <el-footer><Footer /></el-footer>
        </el-container>
      </el-container>
    </el-container>
    <QuotaHelpDialog />
  </div>
</template>

<style>
body {
  margin: 0;
  /* height: 570px; */
}
.app {
  background-color: #f2f3f5;
  border-radius: 10px;
  border:1px solid gray;
  /* Evita seleccionar texto de la interfaz por accidente (botones, menús) */
  -webkit-user-select: none;
  user-select: none;
}
/* ...pero permite seleccionar/copiar en campos de texto y tablas */
.app input,
.app textarea,
.app .el-table,
.app .el-select-dropdown {
  -webkit-user-select: text;
  user-select: text;
}
.el-header {
  border: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  height: auto !important;
  -webkit-app-region: drag;
}
.el-aside {
  width: auto !important;
  overflow: hidden !important;
}
.container {
  margin-top: 5px;
  height: calc(100vh - 40px);
}
.el-main,
.el-footer {
  border: 0 !important;
  padding: 0 !important;
  margin-left: 5px;
}
.main-footer {
  height: 100%;
  display: flex;
}
.el-button {
  -webkit-app-region: no-drag;
}
/* Modo oscuro: paneles propios (Element Plus usa sus css-vars con .dark) */
.dark .app {
  background-color: #0a0a0a;
  border-color: #4c4c4c;
}
.dark .header {
  background-color: #141414;
}
.dark .aside,
.dark .options,
.dark .footer,
.dark .main-config-page,
.dark .fork-card {
  background-color: #141414;
  border-color: #4c4c4c;
  color: #e5e5e5;
}
.dark .q-ex {
  background-color: #2a2a2a;
}
.dark .health-detail {
  color: #a8abb2;
}
</style>

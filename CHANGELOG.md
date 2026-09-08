# CHANGELOG del fork (dorlanpabon/tts-vue)

## v1.9.15-es-co12
- Plan calidad: Electron 19→44 LTS, icono propio, NSIS + portable,
  auto-updater al fork, SSML único testeado, init sin pisar ni carreras,
  lote secuencial, backoff+jitter+Retry-After, claves cifradas,
  semáforo de APIs, historial, F9, modo oscuro, guía ES local,
  README/CHANGELOG ES, CI con 23 tests.

## v1.9.15-es-co11
- Proveedor OpenCode Zen + sus 4 modelos gratis con fallback.

## v1.9.15-es-co10
- Fallback entre modelos :free si el proveedor falla + errores IA accionables.

## v1.9.15-es-co9
- Fix "true" en Interfaz, fallback Azure ante cuota, región eastus.

## v1.9.15-es-co8
- Modal guía Azure paso a paso con hipervínculos.

## v1.9.15-es-co7
- GPT amable: valida clave, errores 401 limpios, diálogo rediseñado.

## v1.9.15-es-co6
- Modal de cuota en simple + lote + audición.

## v1.9.15-es-co5
- Mejoras UI (Documents, Donate, diálogo GPT, hint clave).

## v1.9.15-es-co4
- Sin switch de cuota + proveedores IA (OpenRouter gratis).

## v1.9.15-es-co3
- Ayuda de cuota con guía Azure.

## v1.9.15-es-co2
- Fallo rápido 429/403 en español, traducción del flujo, plantilla Colombia.

## v1.9.15-es-co (base)
- Voz es-CO-SalomeNeural por defecto, SSML dinámico, UI en español.

---


[v2.0.0](https://github.com/electron-vite/electron-vite-vue/pull/156)

- 🖖 Based on the `vue-ts` template created by `npm create vite`, integrate `vite-plugin-electron`
- ⚡️ More simplify, is in line with Vite project structure

## 2022-01-30

[v1.0.0](https://github.com/electron-vite/electron-vite-vue/releases/tag/v1.0.0)

- ⚡️ Main、Renderer、preload, all built with vite

## 2022-01-27
- Refactor the scripts part.
- Remove `configs` directory.

## 2021-11-11
- Refactor the project. Use vite.config.ts build `Main-process`, `Preload-script` and `Renderer-process` alternative rollup.
- Scenic `Vue>=3.2.13`, `@vue/compiler-sfc` is no longer necessary.
- If you prefer Rollup, Use rollup branch.

```bash
Error: @vitejs/plugin-vue requires vue (>=3.2.13) or @vue/compiler-sfc to be present in the dependency tree.
```

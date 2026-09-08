# TTS Vue Colombia 🇨🇴

Fork en español de [LokerL/tts-vue](https://github.com/LokerL/tts-vue): herramienta de escritorio para convertir texto a voz con las voces neurales de Microsoft.

**Lo que cambia este fork:**
- Interfaz en **español** por defecto + inglés y chino.
- Voz por defecto **Colombia**: `es-CO-SalomeNeural` (femenina; alternativa masculina `es-CO-GonzaloNeural`).
- Voces **HD** disponibles: `Dalia`/`Jorge` DragonHD (es-MX), `Ximena`/`Tristán` DragonHD (es-ES), Multilingual y MAI-Voice-2 con estilos (en vivo y en fallback offline).
- `xml:lang` dinámico según la voz (antes fijo en `en-US`).
- **Fallback automático a Azure** ante cuota 429/403 si tienes clave configurada.
- Modal de ayuda paso a paso para crear tu clave gratuita de Azure.
- Proveedores IA: OpenAI, **OpenRouter** (modelos `:free`), **OpenCode Zen** (modelos `-free`) y URL personalizada (Ollama local).
- Actualizaciones desde este fork + auto-updater.

## Uso rápido

1. Descarga el instalador de [Releases](https://github.com/dorlanpabon/tts-vue/releases/latest) e instálalo.
2. Elige idioma `Español (Colombia)` y voz `Salome` (ya vienen por defecto).
3. Escribe, pulsa **Iniciar conversión** y reproduce o descarga el MP3.

> La API gratuita de Microsoft se agota (~24 h de espera). La vía fiable es tu propia clave de **Azure Speech** (nivel F0: 500.000 caracteres/mes gratis): créala con la guía que muestra la app, pégala en Ajustes → SpeechKey + ServiceRegion y cambia la Interfaz a **Azure Speech API**.

## Desarrollo

```bash
npm install
npm run dev    # desarrollo
npm run build  # typecheck + vite + electron-builder
npx vitest run # tests unitarios
```

## Licencia

MIT. Proyecto original de LokerL — ver [LICENSE](LICENSE). Úsalo para aprendizaje/pruebas según el aviso de la app.

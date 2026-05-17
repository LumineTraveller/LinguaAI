# LinguaAI

An AI-powered foreign language reading tool built on the DeepSeek API — zero installation, runs as a single HTML file.

基于 DeepSeek API 的 AI 外语阅读学习工具，无需安装，单个 HTML 文件即可运行。

---

## Features · 功能

- **Article Generation** — Generate authentic foreign-language reading material in one click, with control over language, CEFR level (A1–C2), topic style, and target word count (100–800 words)
- **Hover Lookup** — Hover over any word for 0.65 s to instantly fetch its definition, part of speech, grammatical gender, and an example sentence
- **Three Reading Views** — Switch freely between original text, side-by-side bilingual, and sentence-by-sentence parallel view
- **Grammar & Vocabulary Panel** — Automatic analysis of grammar points and key vocabulary, including parts of speech and grammatical gender
- **Comprehension Quiz** — Auto-generated multiple-choice questions with scoring and retry support
- **Focus / Study Mode** — Focus mode hides translation and grammar panels to minimise distraction
- **History** — Saves the last 40 articles locally (with model metadata) for review at any time
- **Theme Switcher** — Dark / light × blue / purple colour schemes
- **Debug Panel** — View raw API responses for every request to help diagnose issues
- **JSON Auto-Repair** — If an API response cannot be parsed, it is automatically sent back to the model for correction before surfacing an error

---

## Supported Languages · 支持语言

German · French · Spanish · Italian · Japanese · Korean · Portuguese · Russian · Arabic · Dutch · English

德语 · 法语 · 西班牙语 · 意大利语 · 日语 · 韩语 · 葡萄牙语 · 俄语 · 阿拉伯语 · 荷兰语 · 英语

---

## Article Styles · 文章风格

Daily Life · Travel · Food & Culture · History · Technology · Nature · Literature & Poetry · News · Business · Children's Stories · Custom Topic

日常生活 · 旅行游记 · 美食文化 · 历史故事 · 科技话题 · 自然环境 · 文学诗歌 · 新闻报道 · 商务职场 · 儿童故事 · 自定义主题

---

## Usage · 使用方法

1. Get an API key from the [DeepSeek Open Platform](https://platform.deepseek.com/)
2. Download `LinguaAI.html` and open it in any modern browser — no server required
3. Click the **⌘ API Key** button in the right panel, enter your key and select a model
4. Choose a language, difficulty, style, and word count, then click **生成文章** to start

Your API key is stored only in the browser's `localStorage` and is never sent anywhere except the DeepSeek API.

---

## Models · 模型

| Model | Description |
|-------|-------------|
| `deepseek-v4-flash` | Fast responses, recommended for everyday use (default) |
| `deepseek-v4-pro` | Higher output quality, better for complex language analysis |

---

## Tech Stack · 技术栈

Pure HTML / CSS / JavaScript — no dependencies, no build tools.

- **API:** [DeepSeek](https://platform.deepseek.com/) (OpenAI-compatible format)
- **Streaming:** Server-Sent Events (SSE)
- **Storage:** `localStorage`
- **Fonts:** DM Sans (UI) · Crimson Pro (reading text) via Google Fonts

---

## License

[MIT](LICENSE)

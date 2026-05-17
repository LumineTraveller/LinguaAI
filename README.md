# LinguaAI

> An AI-powered foreign language reading and tutoring tool — zero installation, runs as a single HTML file.
>
> 基于 AI 的外语沉浸式阅读与辅导工具，无需安装，单个 HTML 文件即可运行。

---

## Overview · 简介

LinguaAI turns any topic into a personalised reading lesson. It generates authentic foreign-language articles at your chosen CEFR level, then surrounds them with an AI tutor: hover over words for instant definitions, select any sentence to ask the AI a grammar question or request a rewrite in a different style, and test your comprehension with auto-generated quizzes.

LinguaAI 将任意话题转化为个性化阅读课堂。它根据你选择的 CEFR 等级生成地道的外语文章，并以 AI 导师功能环绕其中：悬停单词即时查词，选中任意句子向 AI 提问语法问题或一键改写为不同风格，再通过自动生成的测验检验理解程度。

---

## Features · 功能

### Reading · 阅读

| Feature | 功能 |
|---------|------|
| **Article Generation** — one-click authentic articles at CEFR A1–C2, with selectable language, style, and word count (100–800) | **AI 文章生成** — 按语言、CEFR 难度（A1–C2）、风格和目标词数一键生成原版外语阅读材料 |
| **Three Reading Views** — original text, side-by-side bilingual, sentence-by-sentence parallel | **三种阅读视图** — 原文 / 双栏对照 / 逐句对照，随时切换 |
| **Sentence Hover Highlight** — hovering a word softly highlights the containing sentence and dims surrounding paragraphs for focused reading | **句子悬停高亮** — 悬停单词时当前句轻微高亮，其余段落淡出，提升阅读沉浸感 |
| **Word Hover Lookup** — 0.65 s hover fetches definition, part of speech, grammatical gender, and an example sentence | **单词悬停查词** — 悬停 0.65 秒自动查询释义、词性、语法性别及例句 |

### AI Tutoring · AI 辅导

| Feature | 功能 |
|---------|------|
| **Ask AI** — select any sentence, click *Ask AI*, type a free-form question or pick a preset (grammar, tense, structure, native phrasing) and get a streaming contextual explanation | **AI 导师** — 选中任意句子后点击 Ask AI，可自由提问或选择预设（语法、时态、句子结构、母语表达），AI 流式回答并自动携带文章上下文 |
| **Sentence Rewrite** — select a sentence, choose a style (Simpler / Formal / Casual / Native-like / B1 / C1) and see the rewrite stream inline for side-by-side comparison | **改写对比** — 选中句子后选择改写风格（更简单 / 正式 / 口语 / 母语者 / B1 / C1），改写结果内联展示，支持切换对比 |

### Analysis · 分析

| Feature | 功能 |
|---------|------|
| **Grammar & Vocabulary Panel** — automatic analysis of key grammar points and vocabulary with part of speech and grammatical gender | **语法要点 & 词汇表** — 自动分析文章中的语法点与重点词汇，含词性和语法性别 |
| **Comprehension Quiz** — auto-generated multiple-choice questions with scoring and retry | **理解测验** — 自动生成多选题，支持成绩统计与重做 |

### Utility · 其他

| Feature | 功能 |
|---------|------|
| **Focus / Study Mode** — focus mode hides translation and grammar panels | **专注 / 学习模式** — 专注模式隐藏译文与语法面板，减少干扰 |
| **History** — last 40 articles saved locally with model metadata | **历史记录** — 本地保存最近 40 篇文章，含模型信息 |
| **Theme Switcher** — dark / light × blue / purple | **主题切换** — 深色 / 浅色 × 蓝色 / 紫色 |
| **JSON Auto-Repair** — malformed API responses are automatically sent back for correction | **JSON 自动修复** — API 输出解析失败时自动发回模型纠错 |
| **Debug Panel** — inspect raw API responses | **Debug 面板** — 查看每次 API 的原始回复 |

---

## Supported Languages · 支持语言

German · French · Spanish · Italian · Japanese · Korean · Portuguese · Russian · Arabic · Dutch · English

德语 · 法语 · 西班牙语 · 意大利语 · 日语 · 韩语 · 葡萄牙语 · 俄语 · 阿拉伯语 · 荷兰语 · 英语

---

## Article Styles · 文章风格

Daily Life · Travel · Food & Culture · History · Technology · Nature · Literature & Poetry · News · Business · Children's Stories · Custom Topic

日常生活 · 旅行游记 · 美食文化 · 历史故事 · 科技话题 · 自然环境 · 文学诗歌 · 新闻报道 · 商务职场 · 儿童故事 · 自定义主题

---

## Getting Started · 快速开始

**English**

1. Get an API key from the [DeepSeek Open Platform](https://platform.deepseek.com/)
2. Download `LinguaAI.html` and open it in any modern browser — no server, no install
3. Click **⌘ API Key** in the right panel, enter your key and select a model
4. In the left panel, choose a target language, CEFR level, style, and word count
5. Click **生成文章** — the article, translation, quiz, and grammar analysis generate in sequence

**中文**

1. 前往 [DeepSeek 开放平台](https://platform.deepseek.com/) 申请 API Key
2. 下载 `LinguaAI.html`，用任意现代浏览器打开，无需服务器、无需安装
3. 点击右侧面板的 **⌘ API Key**，输入 Key 并选择模型
4. 在左侧面板选择学习语言、CEFR 等级、文章风格和目标词数
5. 点击 **生成文章** — 文章、译文、测验、语法词汇依次自动生成

> Your API key is stored only in the browser's `localStorage` and is never transmitted anywhere except directly to the DeepSeek API.
>
> API Key 仅保存在本地 `localStorage`，不会上传至任何第三方服务器。

---

## Models · 模型

| Model | Description | 说明 |
|-------|-------------|------|
| `deepseek-v4-flash` | Fast responses, recommended for everyday use **(default)** | 响应速度快，适合日常使用（**默认**） |
| `deepseek-v4-pro` | Higher output quality, better for nuanced language analysis | 输出质量更高，适合复杂语言分析 |

---

## Repository Structure · 仓库结构

```
LinguaAI/
├── LinguaAI.html      # Standalone single-file app (primary)
│                      # 单文件独立版本（主要开发文件）
├── src/               # Split multi-file version for development
│   ├── index.html     # 拆分版（需本地服务器运行）
│   ├── css/           # theme / layout / components / reading / quiz
│   └── js/            # api / grammar / history / article / quiz / ui
├── README.md
└── LICENSE
```

The `src/` version requires a local server (e.g. VS Code Live Server or `python -m http.server`). `LinguaAI.html` opens directly by double-click.

`src/` 拆分版需要本地服务器运行（如 VS Code Live Server 或 `python -m http.server`）。`LinguaAI.html` 双击即可直接打开。

---

## Tech Stack · 技术栈

Pure HTML / CSS / JavaScript — zero dependencies, zero build tools.

纯原生 HTML / CSS / JavaScript，无任何第三方依赖，无需构建工具。

- **API:** [DeepSeek](https://platform.deepseek.com/) — OpenAI-compatible format
- **Streaming:** Server-Sent Events (SSE)
- **Storage:** `localStorage`
- **Fonts:** DM Sans (UI) · Crimson Pro (reading text) via Google Fonts

---

## License

[MIT](LICENSE)

# Harborwish 项目说明书

本文件是本项目的最高工作准则。之后所有工作都必须遵守以下全部条款；如有冲突或不确定之处，先问项目负责人，不要自行决定。

## 目标

- 英文情绪动物图鉴网站，64 个动物页。
- 页面预先生成（静态预渲染）。
- 技术栈：Astro + Cloudflare 官方适配器（`@astrojs/cloudflare`）。
- 接口运行在 Cloudflare Workers，数据库用 Cloudflare D1。

## 网址规则（一旦定下不得更改）

- 动物页：`/animals/{英文小写连字符名}/`（例：`/animals/snow-leopard/`）
- 目录页：`/animals/`
- 象限页：`/quadrants/{名}/`

## 每页必备

1. 独有标题，格式：`{Animal Name} Personality — {Subtitle} | Harborwish`
2. 手写描述（meta description），不超过 155 字符
3. 唯一的 H1
4. 规范网址（canonical）
5. 分享预览图（Open Graph / Twitter 卡片图片）
6. 基础结构化标注（JSON-LD）
7. 图片说明文字（alt 文本）

## 图片

- 自动压缩为 webp。
- 加懒加载（`loading="lazy"`）。

## 禁止事项

- 付费内容：暗流、关系、陷阱、出路四段，不得出现在页面或浏览器端。
- 内部编码或格位号，不得出现在页面上。
- 第三方追踪脚本。
- Cookie 弹窗。
- 阶段 8 之前任何收集个人数据的功能。
- 未经负责人同意新增的接口或数据库表。

## 必须具备

- `sitemap.xml`
- `robots.txt`
- 404 页
- 页脚「非诊断工具」声明（英文呈现，例如 “Not a diagnostic tool”）
- AI 插图说明（说明插图由 AI 生成）

## 语言

- 网站内容全部为英文。
- 语气温暖，使用第二人称（you）。

## 安全

- 不要把任何密码或令牌写进代码；密钥只放在 Cloudflare 的加密变量（secrets）里。
- 打分规则和付费内容只放在服务器端，绝不下发到浏览器。
- 遇到需要负责人决定的事，先问，不要自行决定。

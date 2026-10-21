# 天地蜉蝣

个人博客，Astro + [Fuwari](https://github.com/saicaca/fuwari) 主题，部署在 Cloudflare Workers（Static Assets）。

从 Hexo 迁移而来：文章由旧站构建产物还原为 Markdown，旧链接通过 `_redirects` 做 301。

## 目录

| 路径 | 说明 |
| --- | --- |
| `src/content/posts/` | 文章，文件名即 URL（`/posts/<文件名>/`） |
| `src/content/spec/about.md` | 关于页 |
| `src/config.ts` | 站点标题、语言、横幅、头像、导航、社交链接 |
| `astro.config.mjs` | Astro 配置（站点域名、Markdown 插件、代码高亮） |
| `public/_redirects` | 旧链接 301（Cloudflare 静态资源规则） |
| `public/images/` | 横幅、关于页图片等静态图 |
| `src/assets/images/` | 会被 Astro 压缩处理的图片（如头像） |
| `wrangler.jsonc` | Workers 部署配置 |

## 本地开发

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # 产物在 dist/，末尾会跑 Pagefind 建索引
pnpm preview    # 预览构建结果
```

新增文章：

```bash
pnpm new-post my-post-name
```

## 文章 front matter

```yaml
---
title: 标题
published: 2024-05-09
updated: 2024-10-03   # 可选
description: 摘要，会用于 SEO 和列表
image: ''             # 可选封面，相对 src/content/posts 或 /public
tags: ["GitHub", "Hexo"]
category: 技术分享
draft: false
lang: zh_CN
---
```

支持的 Markdown 扩展：GFM（表格、任务列表、脚注、删除线）、数学公式（KaTeX）、GitHub Alert（`> [!NOTE]` / `[!TIP]` / `[!WARNING]` / `[!IMPORTANT]` / `[!CAUTION]`）、GitHub 仓库卡片（`::github{repo="owner/name"}`）。

## 评论

`src/components/misc/Twikoo.astro`，使用旧的 Twikoo 服务端：

```js
envId: "https://twikoo-cloudflare.zengxianpei2333.workers.dev/"
```

评论按 `window.location.pathname` 归档。**注意**：旧站配置里 `path` 传的是字符串 `"location.pathname"`，如果旧评论确实是按这个字面量存的，迁过来后不会自动映射到新页面，需要在 Twikoo 后台核对。换评论系统只需替换该组件，并在 `src/pages/posts/[...slug].astro` 里换成新组件。

## 部署到 Cloudflare Workers

### 1. 推到 GitHub

```bash
git init
git add .
git commit -m "migrate from hexo"
git remote add origin git@github.com:<你>/<仓库>.git
git push -u origin main
```

### 2. 在 Cloudflare 建 Workers 项目

控制台 → Workers & Pages → Create → Workers → 连接 Git 仓库：

| 配置项 | 值 |
| --- | --- |
| Install command | `pnpm install` |
| Build command | `pnpm build` |
| Deploy command | `npx wrangler deploy` |
| 根目录 | `/`（默认） |

`wrangler.jsonc` 已经声明：

```jsonc
"assets": { "directory": "./dist", "not_found_handling": "404-page" }
```

所以不需要额外指定产物目录，`wrangler deploy` 会直接把 `dist/` 上传为静态资源。

### 3. 绑定域名

- Workers 项目 → Settings → Domains & Routes → 添加自定义域 `www.zengxpmaster.fun`。
- 顶级域 `zengxpmaster.fun` 建一条 Redirect Rule（或 Workers 路由）做 301 到 `www`。
- DNS 在 Cloudflare 托管时无需再放 `CNAME` 文件。

### 4. 切换顺序（保证可回滚）

1. 新项目先跑起来，用 workers.dev 域名验收：文章、404、`_redirects`、搜索、评论、暗色模式、移动端。
2. 绑 `www` 自定义域，观察一天。
3. 暂停（不要立即删除）Cloudflare Pages 旧项目、关闭 GitHub Pages。
4. 观察一周无异常后再删除旧项目。

## 旧链接映射

| 旧地址 | 新地址 |
| --- | --- |
| `/2024-05/如何搭建个人博客.html` | `/posts/how-to-build-a-blog/` |
| `/2024-05/如何破解校园网多设备限制.html` | `/posts/crack-campus-network/` |
| `/2024-10/近况说明.html` | `/posts/life-update-2024/` |
| `/archives/`、`/tags/*`、`/categories/*` | `/archive/` |
| `/message-board/`、`/my-luck/`、`/links/` | `/about/` |

旧的留言板、友链、音乐页没有在新站重建，相关请求 301 到关于页。若要恢复，友链可做成 `src/pages/links.astro`，音乐播放器可参照 Fuwari 社区方案挂 APlayer + Meting。

## 注意事项

- Pagefind 对中文不支持词干分析（stemming），搜索按字面匹配，属于正常现象。
- `.npmrc` 里 `node-linker=hoisted` 是为了在 Windows 上避免 pnpm junction 造成的模块解析问题，可保留。
- 构建机需要 Node 20+。

# 天地蜉蝣

个人博客，Astro + [Fuwari](https://github.com/saicaca/fuwari) 主题，部署在 Cloudflare Workers（Static Assets）。

- 线上：<https://www.zengxpmaster.fun>
- 仓库：<https://github.com/zengxpmaster/blog>
- 图床：<https://img.zengxpmaster.fun>（Cloudflare R2）

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
envId: "https://twikoo.zengxpmaster.fun/"
```

后端是 `twikoo-cloudflare` 这个 Worker，绑了自定义域 `twikoo.zengxpmaster.fun`（原来的 `*.workers.dev` 在国内无法访问）。前端脚本 `public/js/twikoo.all.min.js` 自托管，不依赖任何公共 CDN——之前用的 `cdn.staticfile.org` 实测会断连。

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

### 3. 绑定域名（当前已生效）

`wrangler.jsonc` 用的是 **Workers Route**，不是 Custom Domain：

```jsonc
"routes": [
  { "pattern": "www.zengxpmaster.fun/*", "zone_name": "zengxpmaster.fun" },
  { "pattern": "zengxpmaster.fun/*", "zone_name": "zengxpmaster.fun" }
]
```

原因：`www` 上已经有一条指向 GitHub Pages 的 DNS 记录，`custom_domain: true` 会因为「externally managed DNS records」报错 100117。Route 不需要改 DNS，直接在当前记录（Cloudflare 代理）后面接管流量，回滚时删掉 route 就退回旧站。

裸域由 [src/worker.ts](src/worker.ts) 做 301 到 `www`，`main` + `assets.binding = ASSETS` 的组合让 Worker 既能重定向又能吐静态文件。

### 4. 切换顺序（保证可回滚）

1. 先 `wrangler deploy` 到 workers.dev（国内一般访问不了）或在本地 `astro preview` 验收。
2. Route 生效即切流，观察一天。
3. 暂停（不要立即删除）Cloudflare Pages 旧项目、GitHub Pages 仓库。
4. 观察一周无异常后再删除。

回滚：`wrangler deploy` 前先 `wrangler rollback`，或直接删掉两条 route。

## 旧链接映射

| 旧地址 | 新地址 |
| --- | --- |
| `/2024-05/如何搭建个人博客.html` | `/posts/how-to-build-a-blog/` |
| `/2024-05/如何破解校园网多设备限制.html` | `/posts/crack-campus-network/` |
| `/2024-10/近况说明.html` | `/posts/life-update-2024/` |
| `/posts/836f8b7fa8ea.html`（线上 Hexo） | `/posts/how-to-build-a-blog/` |
| `/posts/7ae7ba9c416f.html`（线上 Hexo） | `/posts/crack-campus-network/` |
| `/posts/ae31ed42a77e.html`（线上 Hexo） | `/posts/life-update-2024/` |
| `/archives/`、`/tags/*`、`/categories/*` | `/archive/` |
| `/message-board/`、`/my-luck/` | `/about/` |

友链页保留为 `/links/`（[src/pages/links.astro](src/pages/links.astro)），图床走外链 `https://img.zengxpmaster.fun/`。

## 注意事项

- Pagefind 对中文不支持词干分析（stemming），搜索按字面匹配，属于正常现象。
- `.npmrc` 里 `node-linker=hoisted` 是为了在 Windows 上避免 pnpm junction 造成的模块解析问题，可保留。
- 构建机需要 Node 20+。

## 图床（Cloudflare R2）

文章配图放 R2，通过 `https://img.zengxpmaster.fun` 访问；浏览页在站内 `/gallery/`。

### 当前状态

| 项 | 值 |
| --- | --- |
| 桶 | `blog-images` |
| 自定义域 | `img.zengxpmaster.fun`（R2 托管） |
| 已有内容 | `images/*`，从旧 GitHub Pages 的 ImgBed 迁入，路径保持不变 |
| 浏览页 | `/gallery/`，清单在 [src/data/gallery.json](src/data/gallery.json) |

旧的 `https://img.zengxpmaster.fun/images/xxxx.png` 链接继续有效，因为对象键与原来一致。

### 上传

```bash
node scripts/upload-image.mjs ./cover.png
# ✓ cover.png → https://img.zengxpmaster.fun/posts/2026-10/cover.png
#   ![](https://img.zengxpmaster.fun/posts/2026-10/cover.png)

node scripts/upload-image.mjs ./cover.png images/202601011200000.png   # 指定对象键
node scripts/upload-image.mjs ./imgs                                    # 整个目录
```

键名以 `images/` 开头时会自动写入 `src/data/gallery.json`，重新构建后出现在图床页。

本机实测直连 `*.r2.cloudflarestorage.com`（S3 端点）会被 TLS 重置，改用 wrangler 走 Cloudflare API：

```bash
pnpm exec wrangler r2 object put blog-images/images/test.png --file=./test.png --content-type=image/png --remote
```

### PicGo

图床设置 → S3 兼容：

| 字段 | 值 |
| --- | --- |
| Endpoint | `https://<账户ID>.r2.cloudflarestorage.com` |
| Bucket | `blog-images` |
| AccessKey / SecretKey | R2 的 S3 密钥（R2 → Manage API Tokens） |
| 自定义域名 | `https://img.zengxpmaster.fun` |
| 存储路径 | `images/` |

S3 端点在国内可能连不上，PicGo 里需要配代理。

## 已知问题

- `img.zengxpmaster.fun` 根路径没有索引（R2 对象存储不认 `index.html`），浏览图床请走 `/gallery/`。
- 站内用到的第三方 CDN 在这个网络下基本不可用（jsdelivr、staticfile、workers.dev 均实测不通），所以评论脚本、字体、图标都走自托管或 Cloudflare 自有域名，新增依赖时注意这一点。

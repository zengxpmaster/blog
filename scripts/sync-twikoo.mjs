// 构建前把 twikoo 前端脚本从 node_modules 拷到 public/js/，避免把 vendor 文件提交进仓库
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require.resolve("twikoo/package.json");
const src = join(dirname(pkg), "dist/twikoo.all.min.js");
const dest = join("public", "js", "twikoo.all.min.js");

if (!existsSync(src)) {
	console.error("[sync-twikoo] 找不到", src);
	process.exit(1);
}
mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log("[sync-twikoo] ->", dest);

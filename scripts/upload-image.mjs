#!/usr/bin/env node
/**
 * 上传图片到 Cloudflare R2（S3 兼容 API），打印可直接粘进文章的 Markdown / 图片 URL。
 *
 * 用法：
 *   node scripts/upload-image.mjs ./cover.png
 *   node scripts/upload-image.mjs ./cover.png posts/2024-05/cover.png
 *   node scripts/upload-image.mjs .            # 上传目录下所有图片
 *
 * 环境变量（放 .env，已在 .gitignore 里）：
 *   R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY
 *   R2_BUCKET            桶名
 *   R2_PUBLIC_BASE       公开访问地址，如 https://img.zengxpmaster.fun
 */
import { createHash, createHmac } from "node:crypto";
import { readFileSync, statSync, readdirSync } from "node:fs";
import { extname, join, basename } from "node:path";

const TYPES = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".gif": "image/gif",
	".svg": "image/svg+xml",
	".avif": "image/avif",
	".ico": "image/x-icon",
};

function loadEnv() {
	const env = { ...process.env };
	try {
		for (const line of readFileSync(".env", "utf8").split("\n")) {
			const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
			if (m && !line.trim().startsWith("#")) env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
		}
	} catch {
		/* 没有 .env 就用进程环境变量 */
	}
	const required = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_BASE"];
	const missing = required.filter((k) => !env[k]);
	if (missing.length) {
		console.error(`缺少环境变量: ${missing.join(", ")}（参考 .env.example）`);
		process.exit(1);
	}
	return env;
}

const sha256 = (data) => createHash("sha256").update(data).digest("hex");
const hmac = (key, data) => createHmac("sha256", key).update(data).digest();

function signAndPut(env, key, body, contentType) {
	const host = `${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
	const path = `/${env.R2_BUCKET}/${key.split("/").map(encodeURIComponent).join("/")}`;
	const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
	const dateStamp = amzDate.slice(0, 8);
	const payloadHash = sha256(body);

	const headers = {
		host,
		"content-type": contentType,
		"x-amz-content-sha256": payloadHash,
		"x-amz-date": amzDate,
	};
	const signedHeaders = Object.keys(headers).sort().join(";");
	const canonicalHeaders = Object.keys(headers)
		.sort()
		.map((k) => `${k}:${headers[k]}\n`)
		.join("");

	const canonicalRequest = ["PUT", path, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
	const scope = `${dateStamp}/auto/s3/aws4_request`;
	const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");

	let k = hmac(`AWS4${env.R2_SECRET_ACCESS_KEY}`, dateStamp);
	k = hmac(k, "auto");
	k = hmac(k, "s3");
	k = hmac(k, "aws4_request");
	const signature = createHmac("sha256", k).update(stringToSign).digest("hex");

	return fetch(`https://${host}${path}`, {
		method: "PUT",
		headers: {
			"Content-Type": contentType,
			"x-amz-content-sha256": payloadHash,
			"x-amz-date": amzDate,
			Authorization: `AWS4-HMAC-SHA256 Credential=${env.R2_ACCESS_KEY_ID}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
		},
		body,
	});
}

async function upload(env, file, key) {
	const body = readFileSync(file);
	const contentType = TYPES[extname(file).toLowerCase()] || "application/octet-stream";
	const res = await signAndPut(env, key, body, contentType);
	if (!res.ok) {
		console.error(`✗ ${key} → HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
		return false;
	}
	const url = `${env.R2_PUBLIC_BASE.replace(/\/$/, "")}/${key}`;
	console.log(`✓ ${basename(file)} → ${url}`);
	console.log(`  ![](${url})`);
	return true;
}

const env = loadEnv();
const input = process.argv[2];
if (!input) {
	console.error("用法: node scripts/upload-image.mjs <文件或目录> [对象键]");
	process.exit(1);
}

const stat = statSync(input);
let ok = true;
if (stat.isDirectory()) {
	const files = readdirSync(input).filter((f) => TYPES[extname(f).toLowerCase()]);
	if (!files.length) {
		console.error("目录里没有可上传的图片");
		process.exit(1);
	}
	for (const f of files) ok = (await upload(env, join(input, f), `${basename(input)}/${f}`)) && ok;
} else {
	const key = process.argv[3] || `posts/${new Date().toISOString().slice(0, 7)}/${basename(input)}`;
	ok = await upload(env, input, key);
}
process.exit(ok ? 0 : 1);

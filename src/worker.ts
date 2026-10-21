// 不依赖 @cloudflare/workers-types 的全局类型，避免 astro check 报 Fetcher 未定义
interface AssetFetcher {
	fetch(request: Request): Promise<Response>;
}

interface Env {
	ASSETS: AssetFetcher;
}

const CANONICAL_HOST = "www.zengxpmaster.fun";

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// 裸域统一 301 到 www，保留路径与查询串
		if (url.hostname !== CANONICAL_HOST) {
			url.hostname = CANONICAL_HOST;
			url.protocol = "https:";
			return Response.redirect(url.toString(), 301);
		}

		return env.ASSETS.fetch(request);
	},
};

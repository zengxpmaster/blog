interface Env {
	ASSETS: Fetcher;
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

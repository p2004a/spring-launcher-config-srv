export interface Env {
    CONFIG_KV: KVNamespace;
}

export default {
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext
    ): Promise<Response> {
        if (request.method != 'GET') {
            return new Response('Method Not Allowed', {
                status: 405,
                headers: {Allow: 'GET'},
            });
        }
        const url = new URL(request.url);
        if (url.pathname !== '/config.json') {
            return new Response("Not Found", {status: 404});
        }
        const value = await env.CONFIG_KV.get("config.json");
        if (value === null) {
            return new Response("config.json not set", {status: 404});
        }
        return new Response(value, {
            status: 200,
            headers: new Headers({'Content-Type': 'application/json'})
        });
    },
};

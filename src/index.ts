export interface Env {
    CONFIG_KV: KVNamespace;
    ACCESS_KEY: string;
}

function isNewConfigCorrect(oldConfig: string | null, newConfig: string): [boolean, string] {
    try {
        const n = JSON.parse(newConfig);
        if (oldConfig === null) {
            return [true, ""];
        }
        const o = JSON.parse(oldConfig);
        // TODO: do something more advanced
        return [true, ""];
    } catch (error) {
        return [false, `Failed to parse as JSON: ${error}`];
    }
}

export default {
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext
    ): Promise<Response> {
        const allowedMethods = ['GET', 'HEAD', 'PUT'];
        if (!allowedMethods.includes(request.method)) {
            return new Response('Method Not Allowed', {
                status: 405,
                headers: {Allow: allowedMethods.join(', ')},
            });
        }
        const url = new URL(request.url);
        if (url.pathname !== '/config.json') {
            return new Response("Not Found", {status: 404});
        }

        const config = await env.CONFIG_KV.get("config.json");
        if (request.method === 'PUT') {
            const accessKey = request.headers.get('AccessKey');
            if (accessKey == null ||
                env.ACCESS_KEY.length != accessKey.length ||
                !crypto.subtle.timingSafeEqual(new TextEncoder().encode(env.ACCESS_KEY),
                                               new TextEncoder().encode(accessKey))
            ) {
                return new Response("Unauthorized", {status: 401});
            }
            const newConfig = await request.text();
            const [correct, errorString] = isNewConfigCorrect(config, newConfig);
            if (!correct) {
                return new Response(`Bad request: ${errorString}`, {status: 400});
            }
            await env.CONFIG_KV.put("config.json", newConfig);
            return new Response("Ok", {status: 200});
        } else {
            if (config === null) {
                return new Response("config.json not set", {status: 404});
            }
            return new Response(config, {
                status: 200,
                headers: new Headers({'Content-Type': 'application/json'})
            });
        }
    },
};

import { createProxyMiddleware, Options as HttpProxyMiddlewareOptions } from 'http-proxy-middleware';

import { ENVIRONMENT } from '../environment';

export default (options?: Partial<HttpProxyMiddlewareOptions>) => {


    const proxyOptions: HttpProxyMiddlewareOptions = {
        target: ENVIRONMENT.FE_ENDPOINT,
        changeOrigin: true,
        logger: console,
        ws: true,
        followRedirects: true,
        pathRewrite: {
            '^/(.*)': `/$1`,
        },
        headers: {
            "host": "localhost:5173"
        },
        on: {
            proxyReq: (proxyReq, req, res) => {
                //TODO:
                // if (req.jwtPayload && req.jwtPayload.userId) {
                //     proxyReq.setHeader('X-User-ID', req.jwtPayload.userId as string); // Cast a string se userId può non esserlo
                // }

                console.log(`[FE] Going to: ${proxyReq.path}`);
            },
            proxyRes: (proxyRes, req, res) => {
                console.log(`[FE] Response was: ${proxyRes.statusCode}`);
            },
            error: (err, req, res, target) => {
                console.error('[FE] Errore nel proxy:', err, 'per target:', target);
                res.end('[FE] Something broke inside proxy (this should not happens). Check console');
            }
        },
        ...(options || {}),
    };

    return createProxyMiddleware(proxyOptions);
}


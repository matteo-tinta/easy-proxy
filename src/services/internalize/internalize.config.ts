import { createProxyMiddleware, Options as HttpProxyMiddlewareOptions } from 'http-proxy-middleware';

import { ENVIRONMENT } from '../../environment';

export default (options?: Partial<HttpProxyMiddlewareOptions>) => {
    const proxyOptions: HttpProxyMiddlewareOptions = {
        target: ENVIRONMENT.TARGET_SERVER,
        changeOrigin: true,
        logger: console,
        followRedirects: true,
        pathRewrite: {
            '^/services/roles/(.*)': `${ENVIRONMENT.TARGET_BASE_PATH}/$1`,
        },
        headers: {
            "x-forwarded-host": `${ENVIRONMENT['X-FORWARDED-HOST']}`
        },
        on: {
            proxyReq: (proxyReq, req, res) => {
                //TODO:
                // if (req.jwtPayload && req.jwtPayload.userId) {
                //     proxyReq.setHeader('X-User-ID', req.jwtPayload.userId as string); // Cast a string se userId può non esserlo
                // }

                console.log(`Going to: ${ENVIRONMENT.TARGET_BASE_PATH}/${proxyReq.path}`);
            },
            proxyRes: (proxyRes, req, res) => {
                if (proxyRes.statusCode && proxyRes.statusCode >= 200) {
                    console.log(`[${ENVIRONMENT.TARGET_BASE_PATH}/${req.url}]: ${proxyRes.statusCode}`)
                }
            },
            error: (err, req, res, target) => {
                console.error('Errore nel proxy:', err, 'per target:', target);
                res.end('Something broke inside proxy (this should not happens). Check console');
            }
        },
        ...(options || {}),
    };

    return createProxyMiddleware(proxyOptions);
}


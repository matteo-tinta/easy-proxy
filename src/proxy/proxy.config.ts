import { createProxyMiddleware, Options as HttpProxyMiddlewareOptions } from 'http-proxy-middleware';
import { ClientRequest, IncomingMessage, ServerResponse } from 'http'; // Importa questi tipi per gli eventi del proxy

import { ENVIRONMENT } from '../environment';

export default (options?: Partial<HttpProxyMiddlewareOptions>) => {
    const proxyOptions: HttpProxyMiddlewareOptions = {
        target: ENVIRONMENT.TARGET_SERVER,
        changeOrigin: true,
        logger: console,
        followRedirects: true,
        pathRewrite: {
            '^/(.*)': `${ENVIRONMENT.TARGET_BASE_PATH}/roles/$1`,
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

                console.log(`Going to: ${proxyReq.path}`);
            },
            proxyRes: (proxyRes, req, res) => {
                console.log(`Response was: ${proxyRes.statusCode}`);
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


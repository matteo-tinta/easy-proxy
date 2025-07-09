import { Router } from "express";
import jwtAuthenticationMiddleware from "../middlewares/jwt.middleware";
import { return401invalidGrant } from "../middlewares/jwt.middleware.handlers";
import generateAuthReverseProxy from "./auth/auth.config";
import generateReverseProxy from "./internalize/internalize.config";
import generateQueryProxy from "./query/query.config";

const jwtMiddlewareWith401Response = jwtAuthenticationMiddleware({
    onError: return401invalidGrant
})

export const servicesRoute = () => {
    const servicesRouter = Router();

    servicesRouter.use(jwtMiddlewareWith401Response)

    //AUTHORIZED ROUTES
    servicesRouter.use("/roles",
        generateReverseProxy()
    )

    servicesRouter.use("/auth",
        generateAuthReverseProxy()
    )

    servicesRouter.use("/query",
        generateQueryProxy()
    )

    return servicesRouter
}
import express from "express";
import cookieParser from "cookie-parser"
import jwtAuthenticationMiddleware from "./middlewares/jwt.middleware"
import generateReverseProxy from "./proxy/proxy.config"
import { ENVIRONMENT } from "./environment";

const startAppAsync = async () => {
    const app = express();

    //basic config
    app.use(cookieParser())

    app.get("/login", (req, res) => {
        const { logout = "" } = req.query

        res.status(200).send(
            logout ? "Logout succeeded" : "You need to login to perform this operation"
        )
    })

    //AUTHORIZED ROUTES

    //jwt decode middleware
    app.use(jwtAuthenticationMiddleware)

    //reverse proxy route
    app.use("/roles", generateReverseProxy())
    app.get("/logout", async (req, res) => {
        const result = await fetch(`${ENVIRONMENT.AUTH_SERVER}${ENVIRONMENT.AUTH_LOGOUT_PATH}`, {
            headers: {
                "Authorization": `Bearer ${req.accessToken}`
            }
        })

        if(!result.ok){
            res.send(401).send({ ok: false })
            return;
        }

        res.clearCookie(ENVIRONMENT.ACCESS_TOKEN_COOKIE_NAME)
        res.clearCookie(ENVIRONMENT.REFRESH_TOKEN_COOKIE_NAME)
        
        res.redirect("/login?logout=success");
    })

    return app;
}

export default startAppAsync;
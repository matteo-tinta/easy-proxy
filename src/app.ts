import cookieParser from "cookie-parser";
import express from "express";
import path from "path";
import generateFeReverseProxy from "./dev/fe-proxy.config";
import { ENVIRONMENT } from "./environment";
import jwtAuthenticationMiddleware from "./middlewares/jwt.middleware";
import { redirectToLogin } from "./middlewares/jwt.middleware.handlers";
import { servicesRoute } from "./services/router";

const jwtMiddlewareForFrontend = jwtAuthenticationMiddleware({
    onError: redirectToLogin
})



const startAppAsync = async () => {
    const app = express();

    //basic config
    app.use(
        express.urlencoded({ extended: true }),
        cookieParser()
    )

    app.get("/login", (req, res) => {
        return res.status(200).sendFile(path.join(__dirname, "pages", 'login.html'));
    })
    app.post("/login", async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.sendFile(path.join(__dirname, "pages", 'login.html'));
        }

        //do auth
        var login = await fetch(`${ENVIRONMENT.AUTH_SERVER}${ENVIRONMENT.AUTH_LOGIN_PATH}?username=${username}&password=${password}`)

        if (!login.ok) {
            console.dir({
                error: "unable to login, login failed on AS",
                login
            })
            return res.sendFile(path.join(__dirname, "pages", 'login.html'));
        }

        //set cookies
        var response = await login.json();

        if (typeof response == "object"
            && "token" in response
            && typeof response.token == "string"
            && "refreshToken" in response
            && typeof response.refreshToken == "string") {

            console.dir({ refreshed: response })

            res.cookie(ENVIRONMENT.ACCESS_TOKEN_COOKIE_NAME, response.token, {
                httpOnly: true, // Make it HttpOnly
                secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
                sameSite: "lax",
                maxAge: 3600000 // 1 hour
            })

            res.cookie(ENVIRONMENT.REFRESH_TOKEN_COOKIE_NAME, response.refreshToken, {
                httpOnly: true, // Make it HttpOnly
                secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
                sameSite: "lax",
                maxAge: 3600000 // 1 hour
            })

            res.redirect("/")

            return;
        }

        console.dir({
            error: "unable to login, login response is invalid",
            login, response
        })

        return res.sendFile(path.join(__dirname, "pages", 'login.html'));
    })

    app.use("/services", servicesRoute())

    //jwt decode middleware for FE (redirect to login)
    app.use(jwtMiddlewareForFrontend)
    app.get("/logout", async (req, res) => {
        const result = await fetch(`${ENVIRONMENT.AUTH_SERVER}${ENVIRONMENT.AUTH_LOGOUT_PATH}`, {

            headers: {
                "Authorization": `Bearer ${req.accessToken}`
            }
        })

        if (!result.ok) {
            res.send(401).send({ ok: false })
            return;
        }

        res.clearCookie(ENVIRONMENT.ACCESS_TOKEN_COOKIE_NAME)
        res.clearCookie(ENVIRONMENT.REFRESH_TOKEN_COOKIE_NAME)

        res.redirect("/login?logout=success");
    })

    //decode JWT
    app.get("/me", (req, res) => res.status(200).send(req.jwtPayload))
    app.use("/", generateFeReverseProxy())

    return app;
}

export default startAppAsync;
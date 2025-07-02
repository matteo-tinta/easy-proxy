import express from "express";
import cookieParser from "cookie-parser"
import jwtAuthenticationMiddleware from "./middlewares/jwt.middleware"
import generateReverseProxy from "./proxy/proxy.config"

const startAppAsync = async () => {
    const app = express();

    //basic config
    app.use(cookieParser())

    app.get("/login", (req, res) => res.status(200).send("You need to login to perform this operation"))

    //AUTHORIZED ROUTES

    //jwt decode middleware
    app.use(jwtAuthenticationMiddleware)

    //reverse proxy route
    app.use("/roles", generateReverseProxy())

    return app;
}

export default startAppAsync;
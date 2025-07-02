import express from "express";
import jwtAuthenticationMiddleware from "./middlewares/jwt.middleware"
import generateReverseProxy from "./proxy/proxy.config"

const startAppAsync = async () => {
    const app = express();

    //jwt decode middleware
    app.use(jwtAuthenticationMiddleware)
    
    //reverse proxy route
    app.use("/", generateReverseProxy())

    return app;
}

export default startAppAsync;
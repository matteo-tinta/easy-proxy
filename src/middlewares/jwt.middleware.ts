import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import fs from "fs";
import path from 'path';
import { measureMemory } from 'vm';
import { ENVIRONMENT } from '../environment';


type TokenResponse = {
    token: string,
    refreshToken: string
}

const redirectToLogin = (res: Response) => res.redirect("/login")

const renewToken = async (refreshToken: string): Promise<TokenResponse> => {
    const data = {
        refresh_token: refreshToken,
        grant_type: 'refresh'
    };

    const encodedData = new URLSearchParams(data).toString();

    console.dir({encodedData: encodedData})

    var request = await fetch(`${ENVIRONMENT.AUTH_SERVER}${ENVIRONMENT.AUTH_RENEW_PATH}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: encodedData
    })

    if(!request.ok) {
        var error = await request.text()
        console.dir(error)
        throw new Error(error)
    }

    var json = await request.json()
    
    if("token" in json && "refreshToken" in json) {
        return json
    }

    throw new Error("Response was malformed, please align to authorization server response")
}

const makeRequest = async (req: Request, res: Response, next: NextFunction, options: {
    tries: number,
    token: string | null,
    refreshToken: string | null
}) => {

    const {
        tries, token, refreshToken
    } = options

    if(tries > 1) {
        throw new Error("Looping (check key)")
    }

    if(!token || !refreshToken){
        //return 401
        //todo: redirect to login
        console.log("Token was not found, redirect to login")
        return redirectToLogin(res)
    }

    try {
        const publicKey = fs.readFileSync(path.join(__dirname, '..', 'keys', 'public.key'));

        const decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] }) as JwtPayload;
        req.accessToken = token,
        req.jwtPayload = decoded;

        next();

    } catch (error) {
        console.dir(error)

        if (error instanceof TokenExpiredError) {
            
            try {
                //try to renew the token
                console.dir({actual: {token, refreshToken}})

                const result = await renewToken(refreshToken)

                console.dir({refreshed: result})

                res.cookie(ENVIRONMENT.ACCESS_TOKEN_COOKIE_NAME, result.token, {
                    httpOnly: true, // Make it HttpOnly
                    secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
                    sameSite: "lax",
                    maxAge: 3600000 // 1 hour
                })

                res.cookie(ENVIRONMENT.REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, {
                    httpOnly: true, // Make it HttpOnly
                    secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
                    sameSite: "lax",
                    maxAge: 3600000 // 1 hour
                })

                return await makeRequest(req, res, next, {
                    tries: tries + 1,
                    token: result.token,
                    refreshToken: result.refreshToken
                }); //avoid looping, cookies must be set

            } catch (error) {
                return redirectToLogin(res);
            }
        }
        
        if (error instanceof JsonWebTokenError) {
            
            return redirectToLogin(res)
        }

        console.error('Errore nella verifica JWT:', error);
        return res.status(500).json({ message: 'Internal proxy jwt decode error (this should not happens)' });
    }
};

export default async (req: Request, res: Response, next: NextFunction) => 
    await makeRequest(req, res, next, { 
        tries: 0,
        token: req.cookies[ENVIRONMENT.ACCESS_TOKEN_COOKIE_NAME],
        refreshToken: req.cookies[ENVIRONMENT.REFRESH_TOKEN_COOKIE_NAME]
    });
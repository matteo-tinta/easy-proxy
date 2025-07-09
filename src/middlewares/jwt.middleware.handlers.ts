import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import fs from "fs";
import path from 'path';
import { measureMemory } from 'vm';
import { ENVIRONMENT } from '../environment';

export const redirectToLogin = (res: Response) => res.redirect("/login")
export const return401invalidGrant = (res: Response) => res.status(401).json({ error: "invalid_grant" })
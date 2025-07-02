import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import fs from "fs";
import path from 'path';

export default (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'invalid token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const publicKey = fs.readFileSync(path.join(__dirname, '..', 'keys', 'public.key'));

    const decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] }) as JwtPayload;
    req.jwtPayload = decoded;
    
    next();

  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return res.status(401).json({ message: error.message });
    }
    if (error instanceof JsonWebTokenError) {
      return res.status(401).json({ message: error.message });
    }

    console.error('Errore nella verifica JWT:', error);
    return res.status(500).json({ message: 'Internal proxy jwt decode error (this should not happens)' });
  }
};
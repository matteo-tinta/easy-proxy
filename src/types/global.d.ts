import { JwtPayload } from 'jsonwebtoken';
import { IncomingMessage } from 'http';

declare global {
  namespace Express {
    interface Request {
      jwtPayload?: JwtPayload & {
        roles: Array<{
          name: string,
          actions: Array<string>
        }>
      };
      accessToken?: string
    }
  }
}


declare module 'http' {
  interface IncomingMessage {
    jwtPayload?: JwtPayload & {
        roles: Array<{
          name: string,
          actions: Array<string>
        }>
      };
    accessToken?: string;
  }
}
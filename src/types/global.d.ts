import { JwtPayload } from 'jsonwebtoken';

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
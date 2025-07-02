## Easy Proxy

Easy Proxy allows to wrap services in basic authentication check before request reaches the wrapped service

## How it works

Proxy checks for 2 cookies, one with the access token and one with the refresh token.

- If cookies are not found, request is redirect to /login
- If cookies are found but the access token is invalid, it will silently reissue a new access token given the refresh token
- If the refresh token is expired or invalid, redirect to /login

### How to run

Needs docker installed and started!

Install dependencies

```bash
pnpm install
```

Build the project

```bash
pnpm build
```

Run the server

```bash
pnpm start
```
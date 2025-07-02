## Easy Proxy
![logo.svg](logo.svg)

Easy Proxy is a backend service that reverse proxy all your services under one root, this proxy.

Fork this repository and configure your services and authentication/authorizations

## How it works

Proxy checks for 2 cookies, one with the access token and one with the refresh token.

You will need to provide those env variables:
- AUTH_SERVER: where is your authentication server. (eg: `AUTH_SERVER="http://localhost:4000"`)
- AUTH_RENEW_PATH: where is the renew path (eg: `AUTH_RENEW_PATH="/token/renew"`

Basic authentication works this way

- If cookies are not found, request is redirect to /login
- If cookies are found but the access token is invalid, it will silently reissue a new access token given the refresh token
- If the refresh token is expired or invalid, redirect to /login

> this repository already contains an example with Internalize, to comphened better the root idea behind this service

### How to run

**Needs docker installed and started!**

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
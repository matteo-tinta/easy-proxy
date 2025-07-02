type ENVIRONMENT = {
    TARGET_SERVER: string
    TARGET_BASE_PATH: string
    "X-FORWARDED-HOST": string
    AUTH_SERVER: string,
    AUTH_RENEW_PATH: string,
    AUTH_LOGOUT_PATH: string,

    ACCESS_TOKEN_COOKIE_NAME: string,
    REFRESH_TOKEN_COOKIE_NAME: string
}

const raise = (message: string) => {
    throw new Error(message)
}

export const ENVIRONMENT: ENVIRONMENT = {
    TARGET_SERVER: process.env["TARGET_SERVER"] ?? raise("TARGET_SERVER is mandatory"),
    TARGET_BASE_PATH: process.env["TARGET_BASE_PATH"] ?? raise("TARGET_BASE_PATH is mandatory"),
    AUTH_SERVER: process.env["AUTH_SERVER"] ?? raise("AUTH_SERVER is mandatory"),
    AUTH_RENEW_PATH: process.env["AUTH_RENEW_PATH"] ?? raise("AUTH_RENEW_PATH is mandatory"),
    AUTH_LOGOUT_PATH: process.env["AUTH_LOGOUT_PATH"] ?? raise("AUTH_LOGOUT_PATH is mandatory"),
    "X-FORWARDED-HOST": process.env["X_FORWARDED_HOST"] ?? "",
    ACCESS_TOKEN_COOKIE_NAME: process.env["ACCESS_TOKEN_COOKIE_NAME"] ?? "net-authorization",
    REFRESH_TOKEN_COOKIE_NAME: process.env["REFRESH_TOKEN_COOKIE_NAME"] ?? "net-refresh-authorization",

}
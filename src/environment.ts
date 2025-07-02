type ENVIRONMENT = {
    TARGET_SERVER: string
    TARGET_BASE_PATH: string
    "X-FORWARDED-HOST": string
}

const raise = (message: string) => {
    throw new Error(message)
}

export const ENVIRONMENT: ENVIRONMENT = {
    TARGET_SERVER: process.env["TARGET_SERVER"] ?? raise("TARGET_SERVER is mandatory"),
    TARGET_BASE_PATH: process.env["TARGET_BASE_PATH"] ?? raise("TARGET_BASE_PATH is mandatory"),
    "X-FORWARDED-HOST": process.env["X_FORWARDED_HOST"] ?? raise("X_FORWARDED_HOST is mandatory")
}
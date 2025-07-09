FROM ynap/certs as ssl
# intermediate image, certs are already present in /tmp/certs
# https://git.yoox.net/users/tintam/repos/docker.zscaler/browse

# Use node 18 base image
FROM node:22.16 as build

# SSL Certificates
COPY --from=ssl /tmp/certs/ /usr/local/share/ca-certificates/
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/zscaler-root-ca.crt.cer
RUN npm config set cafile /usr/local/share/ca-certificates/zscaler-root-ca.crt.cer

RUN update-ca-certificates

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files and lockfile first (for caching)
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy source files
COPY . .

# Build the project
RUN pnpm build
COPY ./src/keys/ ./dist/keys/
COPY ./src/pages/ ./dist/pages/

# Cleanup prod
RUN pnpm prune --prod

# Expose port (adjust if your app uses another port)
EXPOSE 4000

# Start the app
CMD ["pnpm", "start"]

# Stage 2: Use distroless
FROM gcr.io/distroless/nodejs22-debian12

WORKDIR /app

COPY --from=build /app/dist /app/dist
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/pnpm-lock.yaml ./

CMD ["dist/index.js"]

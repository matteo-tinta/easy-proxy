## Easy AS (Auhentication Service)
![Easy AS Logo](logo.png)

Easy AS (Easy Authentication Service) is a simple, standardized authentication service based on username and password.

It implements a minimal OIDC flow for handling login and token issuance.

Easily deployable with Docker Compose – only requires a MongoDB backend.

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

Examples of calling can be found inside /presentation/controllers/*.http
## Strategia di Composizione Frontend con Autenticazione Centralizzata

Questa architettura è una pratica comune e robusta per le applicazioni moderne, spesso realizzata tramite **Micro-Frontends** con **Routing Basato sul Path** o un'applicazione **Monorepo con proxy di frontend**.

Il pilastro di questa strategia è il **Reverse Proxy**, che funge da unico punto d'ingresso e orchestratore del traffico verso i vari frontend e backend, gestendo l'autenticazione in modo centralizzato.

-----

### 1\. Componenti dell'Architettura

  * **Reverse Proxy** (es. l'applicazione `proxy.ts` / `app.ts`):

      * Funge da **unico punto di accesso** per il browser.
      * **Inoltra le richieste** ai frontend e backend corretti in base al path.
      * **Gestisce l'Autenticazione**:
          * **Valida il JWT** per tutte le richieste API.
          * Implementa il **refresh del JWT** (sia silenzioso che con reindirizzamento).
          * Gestisce la creazione e l'aggiornamento dei **cookie HttpOnly** contenenti i token (JWT e Refresh Token).

  * **Frontend Principale (Shell FE)**:

      * Servito sul path radice (`/`).
      * Si occupa della navigazione principale, della home page e della logica iniziale di login.

  * **Frontend "Internalize" (Child FE)**:

      * Servito sul path `/roles/*`.
      * Il frontend proviene dal servizio `internalize` e viene esposto dal proxy.

  * **Servizio di Autenticazione (Identity Provider - IdP)**:

      * Servizio dedicato all'emissione e alla gestione di JWT e Refresh Token.
      * Si occupa di login, registrazione, e interazione con il proxy per il refresh dei token.

  * **Backend API (Opzionale)**:

      * Servizi API che i frontend interrogano, protetti e mediati dal proxy.

-----

### 2\. Configurazione del Reverse Proxy

La configurazione del proxy è cruciale, poiché deve instradare le richieste ai servizi appropriati in base al percorso.

**Esempio di Routing nel `proxy.ts` (Concettuale):**

```typescript
// ... (omesse importazioni e setup iniziali)

// Opzioni per il frontend principale (Shell FE)
const proxyOptionsForShellFE: HttpProxyMiddlewareOptions = {
  target: 'http://shell-fe-container:3000', // URL interno del frontend principale nel Docker network
  changeOrigin: true,
  logLevel: 'debug',
  // onProxyReq, onProxyRes, onError saranno configurati a livello globale o per ciascuna istanza di proxy.
};

// Opzioni per il frontend "Internalize" (Child FE)
const proxyOptionsForInternalizeFE: HttpProxyMiddlewareOptions = {
  target: 'http://internalize-container:3000', // URL interno del servizio 'internalize' nel Docker network
  changeOrigin: true,
  logLevel: 'debug',
  pathRewrite: {
    // Riscrive /roles/qualcosa -> /qualcosa per il backend 'internalize'.
    // Questo è essenziale se il frontend 'internalize' si aspetta di essere servito dalla sua root.
    '^/roles/(.*)': '/$1',
  },
};

// Applicazione del middleware JWT Auth (deve essere eseguito per primo)
app.use(jwtAuthMiddleware);

// Middleware di routing del proxy
// Nota: L'ordine è importante. Le regole più specifiche (es. /roles) devono venire prima.
app.use('/roles', createProxyMiddleware(proxyOptionsForInternalizeFE)); // Tutte le richieste a /roles/* vanno a internalize
app.use('/', createProxyMiddleware(proxyOptionsForShellFE));         // Tutte le altre richieste vanno alla shell FE

// ... (avvio del server)
```

**Punti chiave sul Routing:**

  * **Ordine dei Middleware:** I middleware di proxy devono essere ordinati dal più specifico al più generico (e.g., `/roles` prima di `/`).
  * **`pathRewrite`:** È fondamentale che il `pathRewrite` sia configurato correttamente per ogni servizio, rimuovendo il prefisso del percorso (es. `/roles`) prima di inoltrare la richiesta al container di destinazione, se necessario.

-----

### 3\. Autenticazione e Single Sign-On (SSO)

Questa sezione descrive come l'autenticazione viene gestita centralmente per abilitare il Single Sign-On (SSO) attraverso i frontend.

1.  **Login Iniziale (Gestito dalla Shell FE):**

      * L'utente accede al **Frontend Principale (Shell FE)** tramite il proxy (e.g., `http://dominio.com/`).
      * Se l'utente non è autenticato, la Shell FE reindirizza il browser al **Servizio di Autenticazione (IdP)**.
      * L'IdP autentica l'utente e lo reindirizza a un **`redirect_uri`** precedentemente configurato, che punta a un endpoint sul **Reverse Proxy** (e.g., `https://dominio.com/auth/callback`).
      * **Il Proxy è il "Client" per l'IdP**: L'endpoint `/auth/callback` nel proxy (o un backend a cui il proxy inoltra) scambia il `code` OAuth/OIDC ricevuto dall'IdP con l'Access Token (JWT) e il Refresh Token.
      * **Il Proxy Salva i Token in Cookie HttpOnly**: Il proxy *salva questi token in cookie HttpOnly*, `Secure`, e `SameSite=Lax/Strict` sul dominio del proxy (e.g., `dominio.com`). **Questo è il meccanismo chiave per il SSO**.
      * Dopo aver salvato i cookie, il proxy reindirizza l'utente alla pagina originale o alla home page della Shell FE.

2.  **Richieste Autenticate (dal Browser al Proxy):**

      * Una volta che il proxy ha impostato i cookie, ogni richiesta successiva dal browser al dominio del proxy (e.g., `dominio.com`) includerà automaticamente questi cookie.
      * **Il Proxy intercetta tutte le richieste:**
          * **Valida il JWT:** Il `jwtAuthMiddleware` nel proxy valida il JWT presente nel cookie.
          * **Refresh Silenzioso:** Se il JWT è scaduto (ma il refresh token è ancora valido), il proxy tenta un refresh *silenzioso* (comunicazione backend-to-backend con l'IdP) usando il refresh token dal cookie. Se riceve nuovi token, aggiorna i cookie del browser e ritenta la richiesta originale.
          * **`X-User-ID` Header:** Se la validazione/refresh ha successo, il proxy aggiunge header come `X-User-ID` (e.g., `req.jwtPayload.userId`) alla richiesta *prima* di inoltrarla al frontend (Shell o Internalize) o ai backend API.
      * Il proxy inoltra la richiesta (ora arricchita con gli header di autenticazione) al servizio appropriato (e.g., `shell-fe-container:3000` o `internalize-container:3000`).

3.  **Il Frontend Riceve i Dati Utente (via Header):**

      * Sia il Frontend Principale che il Frontend "Internalize" **non devono leggere direttamente i JWT dai cookie**, dato che sono `HttpOnly` per sicurezza.
      * Invece, accedono ai dati dell'utente (e.g., ID utente, ruoli) dagli **header personalizzati** (`X-User-ID`, `X-User-Roles`) che il proxy ha aggiunto alla richiesta. Questo assicura che i token sensibili rimangono inaccessibili al codice JavaScript frontend.

-----

### 4\. Esempio Docker Compose (Concettuale)

Questo esempio illustra come i servizi sono definiti e interconnessi tramite Docker Compose.

```yaml
version: '3.8'

services:
  # Il reverse proxy
  easy-proxy:
    build: . # O il path alla Dockerfile del proxy
    ports:
      - "4001:8080" # Il proxy ascolta su 8080 nel container, esposto su 4001 sull'host
    environment:
      - PORT=8080
      - TARGET_SERVER=http://some-default-backend:3000 # Un target di default, se necessario
      - JWT_SECRET=il_tuo_segreto_molto_forte_e_lungo
      # Assicurarsi che l'URL dell'IdP sia configurato qui per i redirect e le chiamate di refresh
      - AUTH_SERVICE_URL=http://auth-service:5000 # URL interno del servizio di autenticazione
    volumes:
      - ./dist:/app/dist # Mappa i file compilati del proxy
    depends_on:
      - shell-fe
      - internalize-fe
      - auth-service

  # Il frontend principale Next.js
  shell-fe:
    build: ./frontends/shell # Path all'app Next.js
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://easy-proxy:8080 # Le chiamate API del FE passano sempre per il proxy
    # Nessun port mapping diretto per il FE, è accessibile solo tramite il proxy
    # volumes: ... (se necessari)

  # Il frontend "internalize"
  internalize-fe:
    build: ./frontends/internalize # Path all'app internalize
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://easy-proxy:8080 # Le chiamate API del FE passano sempre per il proxy
    # Nessun port mapping diretto, accessibile solo tramite il proxy
    # volumes: ... (se necessari)

  # Il servizio di autenticazione (IdP)
  auth-service:
    build: ./services/auth # Path al servizio Auth
    ports:
      - "5000:5000" # Se si desidera che sia accessibile direttamente per debug, altrimenti solo interno
    environment:
      - AUTH_SECRET=altro_segreto_lungo
      # ...altre variabili per l'IdP, inclusi i client_id, client_secret e redirect_uri supportati
    # volumes: ... (se necessari)

  # (Opzionale) Esempio di un backend API generico
  # some-default-backend:
  #   build: ./backends/default-api
  #   # Nessun port mapping, accessibile solo tramite il proxy
  #   # volumes: ... (se necessari)

networks:
  default: # Assicurarsi che tutti i servizi siano sulla stessa rete Docker per comunicare
```

-----

## Riassunto del Flusso Completo

1.  **Richiesta Browser (`http://localhost:4001/`)**: L'utente accede alla URL del proxy.

2.  **`easy-proxy` (Valutazione JWT)**:

      * Il proxy intercetta la richiesta e tenta di validare il JWT dai cookie.
      * Se il JWT è assente, non valido o scaduto:
          * Il proxy tenta un **refresh silenzioso** chiamando il Servizio di Autenticazione (`auth-service`) con il Refresh Token memorizzato nei cookie.
          * **Se il refresh ha successo**: Il proxy riceve nuovi token, aggiorna i cookie nel browser dell'utente, e **ritenta la richiesta originale**. Se la richiesta ora è autenticata, la risposta viene inoltrata al frontend. L'utente non percepisce interruzioni.
          * **Se il refresh fallisce** (e.g., refresh token scaduto): Il proxy **reindirizza il browser (HTTP 302)** al Servizio di Autenticazione (e.g., `http://auth-service:5000/login?redirect_uri=http://localhost:4001/auth/callback`).
      * Se il JWT è valido (o dopo un refresh riuscito), il proxy aggiunge gli header (`X-User-ID`, etc.) e inoltra la richiesta al frontend appropriato (Shell FE o Internalize FE) basandosi sul path.

3.  **Browser reindirizzato al Servizio di Autenticazione**: L'utente interagisce con la pagina di login dell'IdP.

4.  **Servizio di Autenticazione**: Autentica l'utente e poi lo reindirizza (via browser) all'URL di callback configurato sul proxy (e.g., `http://localhost:4001/auth/callback?code=...`).

5.  **Proxy (Endpoint di Callback `/auth/callback`)**:

      * Il proxy riceve il `code` (o i token, a seconda del flusso OAuth/OIDC).
      * Scambia il `code` con il Servizio di Autenticazione per ottenere i token finali (nuovi JWT e Refresh Token).
      * **Salva i nuovi token in cookie HttpOnly/Secure** sul browser dell'utente.
      * Reindirizza il browser dell'utente alla pagina da cui era partito o alla home page.

6.  **I Frontend (Shell FE e Internalize FE)**:

      * Fanno richieste API al loro backend **attraverso il proxy** (e.g., `http://localhost:4001/api/users` o `http://localhost:4001/roles/api/data`).
      * **Non hanno bisogno di gestire i JWT manualmente**; il browser invia automaticamente i cookie al proxy.
      * Leggono gli **header personalizzati** (`X-User-ID`, `X-User-Roles`) che il proxy ha aggiunto per ottenere le informazioni dell'utente autenticato.

Questo pattern è estremamente potente perché centralizza l'intera logica di autenticazione e sicurezza al livello del proxy, liberando i singoli frontend e backend dal dovere di gestire direttamente i token in modo complesso e disaccoppiandoli dal meccanismo di autenticazione stesso.
# Setup Dev

## Fresh Start

```bash
# Pulisci DB
npm run db:down

# Avvia DB
npm run db:up

# Attendi ~2s per avvio container
sleep 2

# Crea schema
npm run db:bootstrap

# (Opzionale) Carica giocatori
npm run db:seed:players

# Avvia bot
npm run dev
```

## Dettagli Flusso

### Startup del Bot

Il bot chiama `initDatabase()` in `src/index.js`:
1. **authenticate** — connette a DB
2. **sync()** — sincronizza modelli Sequelize con schema DB  
   - Crea tabelle se non esistono
   - Aggiorna colonne se modelli cambiano
   - ⚠️ Non esegue migrazioni custom in `database/migrations/`
3. **ensureSingleton** — assicura riga singleton in `league_state`

### Dev Workflow

#### Setup iniziale
```bash
npm run db:bootstrap  # Esegue schema.sql (crea tutto)
npm run dev           # Auto-sincronizza + avvia
```

#### Update modelli
Se modifichi `src/models/*.js`:
```bash
npm run dev           # sync() auto-applica il cambio
```

#### Reset completo
```bash
npm run db:down       # Elimina container + volume
npm run db:up         # Nuovo container
npm run db:bootstrap  # Ricarica schema
npm run dev
```

### Prod (Docker)

1. Container avvia con ENV vars (`.env` o Docker secrets)
2. Bot chiama `initDatabase()`:
   - `sync()` applica modelli Sequelize
   - `ensureSingleton()` garantisce league_state
3. Bot ready

**Nota:** Migrazioni in `database/migrations/` sono ref storiche. Se devi eseguire SQL custom in prod, aggiungi hook in `init.js` o usa tool esterno (Sequelize CLI, Flyway, etc.).

## Note

- **schema.sql** + **migrazioni/** = reference docs, non auto-eseguiti in prod
- **sync()** = single source of truth per struttura DB
- Admin gestiti via **DISCORD_ADMIN_ROLE_ID** (env var), non DB


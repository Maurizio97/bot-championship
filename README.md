# FC26 Discord Bot - Campionato Online

Bot Discord modulare per gestire squadre, giocatori, budget, trasferimenti ed evoluzione overall con controllo admin via Discord ID.

## Stack

- Node.js
- discord.js v14
- Sequelize ORM
- PostgreSQL o MySQL

## Struttura progetto

```text
src/
 ├── commands/
 ├── events/
 ├── database/
 ├── models/
 ├── repositories/
 ├── services/
 ├── utils/
 ├── config/
 └── index.js
```

## Setup rapido

1. Copia `.env.example` in `.env`
2. Inserisci token Discord e config DB
3. Installa dipendenze
4. Avvia il bot

```bash
npm install
npm start
```

## Database con Docker (consigliato)

Il bot gira in locale, mentre PostgreSQL gira in Docker tramite `docker-compose.yml`.

1. Avvia il DB containerizzato
2. Usa i valori di `.env.example` (sono gia allineati al container)
3. Avvia il bot

```bash
npm run db:up
npm start
```

Per vedere i log DB:

```bash
npm run db:logs
```

Per fermare il DB:

```bash
npm run db:down
```

## Comandi implementati

- `&addteam <nomeSquadra> <discordOwnerId>`
- `&assignplayer <playerId> <teamId>`

Entrambi richiedono che l'autore del messaggio sia presente nella tabella `admins`.

## Schema database

- SQL completo: `database/schema.sql`
- Query esempio e seed: `database/example-queries.sql`

## Relazioni principali

- `teams` 1:N `players`
- `players` 1:N `transfers`
- `teams` 1:N `transfers` (sia `from_team_id` sia `to_team_id`)
- `admins` 1:N `transfers`
- `players` 1:N `overall_history`
- `admins` 1:N `overall_history`

## Note estendibilita

- Nuovi comandi: aggiungi file in `src/commands/` e registralo in `src/commands/index.js`
- Nuove regole business: centralizzale in `src/services/`
- Accesso DB isolato in `src/repositories/`


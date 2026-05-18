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

Bootstrap iniziale schema + seed admin (opzionale):

```bash
npm run db:bootstrap
npm run db:bootstrap -- encke_
```

Seed 10 giocatori per test:

```bash
npm run db:seed:players
```

Nota: nel progetto `discord_id` viene usato come chiave testuale (username Discord).

## Valuta interna

- La valuta e gestita a unita semplici
- Budget iniziale squadra: `700`
- Prezzo giocatori e trasferimenti usano la stessa scala a unita

## Comandi implementati

- `&addteam <nomeSquadra> <@owner>`
- `&admins`
- `&addadmin <@utente> <role>`
- `&removeadmin <@utente>`
- `&assignplayer <nomeGiocatore|playerId> <teamId>`
- `&updateteam <teamId> <nuovoNomeSquadra> <@owner>`
- `&continueteams`, `&closeteams`
- `&iniziodraft`, `&pausadraft`, `&continua`, `&chiudidraft`
- `&turno`, `&ordine`
- `&scegli <nomeGiocatore|playerId>`, `&assegna <nomeGiocatore|playerId>`
- `&aggiungi <nomeSquadra|@owner> <amount> <reason>`, `&togli <nomeSquadra|@owner> <amount> <reason>`
- `&aprimercato`, `&chiudimercato`
- `&rosa [nomeSquadra|@owner]`, `&budget [nomeSquadra|@owner]`, `&valore <nomeGiocatore|playerId>`, `&chi <nomeGiocatore|playerId>`
- `&comandi`

I comandi admin (`&addteam`, `&assignplayer`, `&updateteam`) richiedono che l'autore del messaggio sia presente nella tabella `admins`.

Nota: per selezionare un utente nei comandi admin/team owner, la mention Discord (`@utente`) e obbligatoria.

`&assignplayer` cerca il giocatore per nome; se trova piu risultati, suggerisce i primi 10 match con relativo ID.

## Schema database

- SQL completo: `database/schema.sql`
- Migrazione incrementale: `database/migrations/001_admin_teamselection_draft.sql`
- Query esempio e seed: `database/example-queries.sql`
- Seed 10 giocatori: `database/seed-players.sql`

## Nuove tabelle e persistenza stato

- `league_state`: singleton globale con stato draft/mercato/team selection, turno e round correnti
- `draft_orders`: ordine persistente per `TEAM_SELECTION` e `PLAYER_DRAFT`
- `budget_logs`: storico completo accrediti/addebiti/pick
- `teams.name`: nome squadra/club registrato e scelto durante team selection

Nota UI: quando un comando restituisce una squadra, l'output mostra sempre anche il tag Discord dell'owner di fianco al nome.

## Draft e restart bot

- Ordine, round, turno e status sono persistiti in DB: restart non azzera i progressi.
- `&continua` e `&continueteams` mantengono ordine e turno.
- `&iniziodraft` rigenera un ordine random nuovo e resetta turno/round.
- Pseudocodice e transaction examples: `docs/draft-flow.md`

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


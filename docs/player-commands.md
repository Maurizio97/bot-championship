# Documentazione - Nuovi Comandi di Gestione Giocatori

## Sommario

Sono stati aggiunti due nuovi comandi Discord per la gestione e visualizzazione dei giocatori:

1. **`giocatoriiberi`** - Mostra i giocatori liberi (non assegnati a nessun team)
2. **`giocatoripresi`** - Mostra i giocatori già assegnati a un team

## Comandi

### 1. Comando `giocatoriiberi`

#### Descrizione
Mostra l'elenco dei giocatori liberi (svincolati), ordinati per `overall` in ordine decrescente.

#### Alias
- `liberi`
- `svincolati`

#### Sintassi
```
!giocatoriiberi [role] [--page=1] [--per-page=20]
```

#### Parametri
- `role` (opzionale): Filtra i giocatori per ruolo con sigla o testo (es. `att`, `cen`, `dif`)
- Il filtro non e case-sensitive
- `--page=N` (opzionale, default=1): Numero della pagina da visualizzare
- `--per-page=N` (opzionale, default=20, max=100): Numero di giocatori per pagina

#### Output
Per ogni giocatore viene mostrato:
- ID
- Nome
- Ruolo
- Overall
- Team (se presente, altrimenti "Svincolato")

#### Esempi di utilizzo
```
!liberi
!liberi att
!liberi ATT --page=2
!giocatoriiberi --per-page=50
!svincolati dif --page=3 --per-page=15
```

---

### 2. Comando `giocatoripresi`

#### Descrizione
Mostra l'elenco dei giocatori già assegnati a un team, ordinati per `overall` in ordine decrescente.

#### Alias
- `presi`
- `assegnati`

#### Sintassi
```
!giocatoripresi [role] [--page=1] [--per-page=20]
```

#### Parametri
- `--page=N` (opzionale, default=1): Numero della pagina da visualizzare
- `--per-page=N` (opzionale, default=20, max=100): Numero di giocatori per pagina
- `role` (opzionale): Filtra i giocatori per ruolo con sigla o testo (es. `att`, `cen`, `dif`)
- Il filtro non e case-sensitive

#### Output
Per ogni giocatore viene mostrato:
- ID
- Nome
- Ruolo
- Overall
- Team associato

#### Esempi di utilizzo
```
!presi
!presi att
!assegnati --page=2
!giocatoripresi --per-page=50
!presi ATT --page=3 --per-page=15
```

---

## Implementazione Tecnica

### File Modificati

#### 1. `src/repositories/playerRepository.js`
- Aggiunta funzione `findFreePlayers(options)`: Recupera giocatori liberi con paginazione e filtro di ruolo
- Aggiunta funzione `findTakenPlayers(options)`: Recupera giocatori assegnati con paginazione

**Parametri comuni:**
```javascript
{
  limit: number,      // Elementi per pagina
  offset: number,     // Offset dalla pagina
  role: string        // (solo findFreePlayers) Filtro opzionale per ruolo
}
```

**Return format:**
```javascript
{
  players: Player[],  // Array dei giocatori
  total: number,      // Totale elementi disponibili
  limit: number,      // Limite elementi per pagina
  offset: number,     // Offset utilizzato
  pages: number       // Numero totale di pagine
}
```

#### 2. `src/commands/giocatoriiberi.js` (Nuovo)
Comando per visualizzare i giocatori liberi con:
- Supporto per filtro di ruolo opzionale
- Paginazione con flag `--page` e `--per-page`
- Output in formato Discord embed
- Gestione del caso "nessun risultato"

#### 3. `src/commands/giocatoripresi.js` (Nuovo)
Comando per visualizzare i giocatori assegnati con:
- Paginazione con flag `--page` e `--per-page`
- Output in formato Discord embed
- Gestione del caso "nessun risultato"

#### 4. `src/commands/index.js`
- Aggiunta import dei due nuovi comandi
- Registrazione dei comandi nella mappa di comandi disponibili

#### 5. `tests/playerCommandsAccess.test.js` (Nuovo)
Test per i due nuovi comandi che verificano:
- Accessibilità ai utenti normali (adminOnly=false)
- Correttezza degli alias
- Supporto filtro per ruolo (giocatoriiberi)
- Supporto paginazione con flag

---

## Convenzioni Riutilizzate dal Progetto

1. **Struttura Comandi**: Seguono lo stesso pattern dei comandi esistenti
2. **Paginazione**: Implementata con limite massimo di 100 elementi per pagina
3. **Output Discord**: Utilizzato `successEmbed` di `embedFactory`
4. **Ordine risultati**: Per `overall` in ordine decrescente come richiesto
5. **Namespacing**: Comandi italiani coerenti con il resto del bot

---

## Gestore Query Parametri

I due comandi utilizzano una funzione helper locale `parseCommandArgs()` che converte i parametri nel formato:
```
comando [parametro_posizionale] [--flag=valore]
```

Esempio:
- `!liberi att --page=2 --per-page=15`
- `!presi --page=3 --per-page=20`

---

## Test Eseguiti

✓ Comandi accessibili agli utenti normali (adminOnly=false)
✓ Alias corretti per entrambi i comandi
✓ Supporto filtro ruolo per giocatoriiberi
✓ Supporto paginazione con flag `--page` e `--per-page`
✓ Gestione paginazione corretta con offset calcolato
✓ Tutti i 34 test passano (inclusi i nuovi 6 test)

---

## Campi Visualizzati

### Giocatori Liberi
| Campo | Valore |
|-------|---------|
| ID | `player.id` |
| Nome | `player.player_name` |
| Ruolo | `player.role` |
| Overall | `player.overall` |
| Team | `player.team?.name \|\| "Svincolato"` |

### Giocatori Presi
| Campo | Valore |
|-------|---------|
| ID | `player.id` |
| Nome | `player.player_name` |
| Ruolo | `player.role` |
| Overall | `player.overall` |
| Team | `player.team.name` |

---

## Note Importanti

1. **Relazione Player-Team**: I comandi riutilizzano la relazione `belongsTo` già definita nel modello
2. **Validazione Ruolo**: Il filtro di ruolo non e case-sensitive e accetta anche prefissi/sigle (es. `att`)
3. **Limite Paginazione**: È limitato a massimo 100 elementi per pagina per evitare overflow di embed Discord
4. **Comandi Pubblici**: Entrambi i comandi sono accessibili a tutti gli utenti (non richiedono permessi admin)
5. **Alias Inclusi**: Entrambi i comandi hanno alias più brevi per facilità d'uso


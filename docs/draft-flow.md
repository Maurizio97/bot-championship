# Draft Flow (Pseudocodice)

## Inizio draft (`&iniziodraft`)

```text
BEGIN TRANSACTION
  state = lock league_state (id=1)
  teams = load teams
  require teams.length > 0

  order = shuffle(teams)
  delete draft_orders where type = PLAYER_DRAFT
  insert draft_orders(type=PLAYER_DRAFT, team_id, discord_user_id, position)

  state.draft_status = ACTIVE
  state.current_round = 1
  state.current_draft_turn = 0
  save state
COMMIT
```

## Pick giocatore (`&scegli <nomeGiocatore>`)

```text
BEGIN TRANSACTION
  state = lock league_state
  require state.draft_status == ACTIVE

  order = load draft_orders PLAYER_DRAFT ordered by position
  current = order[state.current_draft_turn]
  require current.discord_user_id == caller

  player = resolve by id/name
  lock player row
  require player.team_id is null

  team = lock current.team_id
  require team.budget >= player.price

  player.team_id = team.id
  team.budget -= player.price

  insert transfer(from_team_id=null, to_team_id=team.id, price, created_by_admin_id=null)
  insert budget_logs(type=DRAFT_PURCHASE, amount=-price, reason="Draft round X")

  state.current_draft_turn += 1
  if state.current_draft_turn >= order.length:
    state.current_draft_turn = 0
    state.current_round += 1
  save state
COMMIT
```

## Team selection (`&startteams`, `&sceglisquadra`)

```text
&startteams:
  genera ordine random
  salva in draft_orders type TEAM_SELECTION
  state.team_selection_status = ACTIVE
  state.current_team_selection_turn = 0

&sceglisquadra:
  require team_selection_status == ACTIVE
  require caller == draft_orders[current_team_selection_turn].discord_user_id
  require selected_club_name univoco
  update teams.selected_club_name
  advance current_team_selection_turn
  if finito -> team_selection_status = CLOSED
```

## Restart safety

- Ordini e turni sono in DB (`draft_orders`, `league_state`), quindi restart non resetta draft/team selection.
- `&continua` / `&continueteams` riattivano solo status ACTIVE senza rigenerare ordine.
- `&iniziodraft` rigenera ordine random nuovo e resetta round/turno.

## Esempi embed moderni

```js
successEmbed('Pick confermata', 'Giocatore assegnato con transazione atomica.', [
  { name: 'Giocatore', value: 'Haaland', inline: true },
  { name: 'Costo', value: '120', inline: true },
  { name: 'Budget residuo', value: '580', inline: true },
  { name: 'Round', value: '3', inline: true },
  { name: 'Prossimo turno', value: '4 - TeamB', inline: false }
]);
```

## Esempio transaction Sequelize

```js
await sequelize.transaction(async (transaction) => {
  const state = await leagueStateRepository.getForUpdate(transaction);
  const team = await teamRepository.findByIdForUpdate(teamId, transaction);

  team.budget -= amount;
  await teamRepository.save(team, { transaction });

  state.current_draft_turn += 1;
  await state.save({ transaction });
});
```


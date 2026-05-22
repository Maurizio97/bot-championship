const sequelize = require('../database/sequelize');
const Team = require('./Team');
const Player = require('./Player');
const Transfer = require('./Transfer');
const OverallHistory = require('./OverallHistory');
const LeagueState = require('./LeagueState');
const DraftOrder = require('./DraftOrder');
const BudgetLog = require('./BudgetLog');

Team.hasMany(Player, { foreignKey: 'team_id', as: 'players' });
Player.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });

Player.hasMany(Transfer, { foreignKey: 'player_id', as: 'transfers' });
Transfer.belongsTo(Player, { foreignKey: 'player_id', as: 'player' });

Team.hasMany(Transfer, { foreignKey: 'from_team_id', as: 'outgoingTransfers' });
Team.hasMany(Transfer, { foreignKey: 'to_team_id', as: 'incomingTransfers' });
Transfer.belongsTo(Team, { foreignKey: 'from_team_id', as: 'fromTeam' });
Transfer.belongsTo(Team, { foreignKey: 'to_team_id', as: 'toTeam' });

Team.hasMany(DraftOrder, { foreignKey: 'team_id', as: 'draftOrders' });
DraftOrder.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });

Team.hasMany(BudgetLog, { foreignKey: 'team_id', as: 'budgetLogs' });
BudgetLog.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });

Player.hasMany(OverallHistory, { foreignKey: 'player_id', as: 'overallHistory' });
OverallHistory.belongsTo(Player, { foreignKey: 'player_id', as: 'player' });

module.exports = {
  sequelize,
  Team,
  Player,
  Transfer,
  OverallHistory,
  LeagueState,
  DraftOrder,
  BudgetLog
};


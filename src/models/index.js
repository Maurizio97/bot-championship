const sequelize = require('../database/sequelize');
const Team = require('./Team');
const Player = require('./Player');
const Admin = require('./Admin');
const Transfer = require('./Transfer');
const OverallHistory = require('./OverallHistory');

Team.hasMany(Player, { foreignKey: 'team_id', as: 'players' });
Player.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });

Player.hasMany(Transfer, { foreignKey: 'player_id', as: 'transfers' });
Transfer.belongsTo(Player, { foreignKey: 'player_id', as: 'player' });

Team.hasMany(Transfer, { foreignKey: 'from_team_id', as: 'outgoingTransfers' });
Team.hasMany(Transfer, { foreignKey: 'to_team_id', as: 'incomingTransfers' });
Transfer.belongsTo(Team, { foreignKey: 'from_team_id', as: 'fromTeam' });
Transfer.belongsTo(Team, { foreignKey: 'to_team_id', as: 'toTeam' });

Admin.hasMany(Transfer, { foreignKey: 'created_by_admin_id', as: 'transfersCreated' });
Transfer.belongsTo(Admin, { foreignKey: 'created_by_admin_id', as: 'createdByAdmin' });

Player.hasMany(OverallHistory, { foreignKey: 'player_id', as: 'overallHistory' });
OverallHistory.belongsTo(Player, { foreignKey: 'player_id', as: 'player' });

Admin.hasMany(OverallHistory, { foreignKey: 'updated_by_admin_id', as: 'overallUpdates' });
OverallHistory.belongsTo(Admin, { foreignKey: 'updated_by_admin_id', as: 'updatedByAdmin' });

module.exports = {
  sequelize,
  Team,
  Player,
  Admin,
  Transfer,
  OverallHistory
};


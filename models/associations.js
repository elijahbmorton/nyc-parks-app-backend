const Review = require("./review");
const User = require("./user");
const Friend = require("./friend");
const Park = require("./park");
const Report = require("./report");

function createDbAssociations() {
    // User - Review
    Review.belongsTo(User, { foreignKey: 'userId' });
    User.hasMany(Review, { foreignKey: 'userId' });
    // User - Friend
    User.hasMany(Friend, { foreignKey: 'userId', as: 'userOf' });
    User.hasMany(Friend, { foreignKey: 'friendId', as: 'friendOf'  });
    Friend.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Friend.belongsTo(User, { foreignKey: 'friendId', as: 'friend' });
    // Park - Review
    Park.hasMany(Review, { foreignKey: 'parkId', sourceKey: 'GlobalID' });
    Review.belongsTo(Park, { foreignKey: 'parkId', targetKey: 'GlobalID' });
    // User - Report
    Report.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });
    User.hasMany(Report, { foreignKey: 'reporterId' });
    // Review - Report
    Report.belongsTo(Review, { foreignKey: 'reviewId' });
    Review.hasMany(Report, { foreignKey: 'reviewId' });
}

module.exports = {
    createDbAssociations,
}
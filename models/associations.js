const Review = require("./review");
const User = require("./user");
const Friend = require("./friend");

function createDbAssociations() {
    // User - Review
    Review.belongsTo(User, { foreignKey: 'userId' });
    User.hasMany(Review, { foreignKey: 'userId' });
    // User - Friend
    User.hasMany(Friend, { foreignKey: 'userId', as: 'userOf' });
    User.hasMany(Friend, { foreignKey: 'friendId', as: 'friendOf'  });
    Friend.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Friend.belongsTo(User, { foreignKey: 'friendId', as: 'friend' });
}

module.exports = {
    createDbAssociations,
}
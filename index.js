const express = require("express");
const db = require("./db.js");
const _Sequelize = require('sequelize');
const Sequelize = _Sequelize.Sequelize;
require('dotenv').config()

// Env variables
const PORT = process.env.PORT || 3000;

// Db init
(async () => {
    try {
        await db.init();
        await db.testConnection();
        await appInit();
        process.on("uncaughtException", (err) => {
            console.log("uncaughtException", err);
        });
    } catch (e) {
        console.error('App startup error', e);
        process.exit();
    }
})();

async function appInit() {
  // Start node
  const app = express();

  // Routers
  app.use(express.json());
  app.use('/api/auth', require("./routes/auth"));
  app.use('/api/review', require("./routes/review"));
  app.use('/api/user', require("./routes/user"));
  app.use('/api/friend', require("./routes/friend"));
  app.use('/api/search', require("./routes/search"));

  // Associations
  const associations = require('./models/associations');
  associations.createDbAssociations();

  // Sync all tables
  await db.getSequelize().sync();
  console.log('All tables synced successfully!');

  // Start app
  app.listen(PORT, "127.0.0.1", async () => {
    console.log(`connected at port ${PORT}`);
  });
}
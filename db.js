const mysql = require('mysql2/promise');
const _Sequelize = require('sequelize');
const Sequelize = _Sequelize.Sequelize;
require('dotenv').config()

// MySQL
const MYSQL_URL = process.env.MYSQL_URL;
const MYSQL_DB = process.env.MYSQL_DB;
const MYSQL_USER = process.env.MYSQL_USER;
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;

let connection;
let pool;
let sequelize;

async function init() {
    connection = await mysql.createConnection({
        host: MYSQL_URL,
        user: MYSQL_USER,
        password: MYSQL_PASSWORD,
        database: MYSQL_DB,
    });
    await connection.connect();

    sequelize = new Sequelize(MYSQL_DB, MYSQL_USER, MYSQL_PASSWORD, {
        host: MYSQL_URL,
        dialect: 'mysql',
        logging: (logMessage, logLevel) => {
            // Show logs for "warn" and above (warn, error, and fatal)
            if (logLevel === 'warn' || logLevel === 'error' || logLevel === 'fatal') {
                //logger.error(logMessage, {fn: "init"});
                console.error('init', logMessage);
            }
        },
    });

    pool = mysql.createPool({
        host: MYSQL_URL,
        user: MYSQL_USER,
        password: MYSQL_PASSWORD,
        database: MYSQL_DB,
        waitForConnections: true,
        connectionLimit: 50,
        queueLimit: 0
    });
}

function getPool(db) {
    return pool;
}

async function testConnection() {
    let [rows, fields] = await pool.execute('SELECT 1 + 1 AS solution');
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
}

/**
 * @deprecated This is for testing purpose only, please use repo methods like find, findOne, save, delete etc
 */
function getConnection() {
    return connection;
}

function getSequelize() {
    return sequelize;
}

/**
 * @deprecated This is for testing purpose only, please use repo methods like find, findOne, save, delete etc
 */
async function end() {
    connection.end();
}


/**
 * common db methods 
 */

async function rawQuery(q, params, db = 'default') {
    let res = await getPool(db).query(q, params);
    logDbCall(q, params, res);
    return res;
}

async function save(q, params, db = 'default') {
    let res = await getPool(db).execute(q, params);
    logDbCall(q, params, res);
}

async function saveMany(q, params, db = 'default') {
    let res = await getPool(db).query(q, params);
    logDbCall(q, params, res);
}

async function findOne(q, params, db = 'default') {
    let [rows, fields] = await getPool(db).execute(q, params);
    logDbCall(q, params, rows);
    if (rows.length > 0) {
        return rows[0];
    } else {
        return null;
    }
}

async function deleteRows(q, params, db = 'default') {
    let [results, fields] = await getPool(db).execute(q, params)
    logDbCall(q, params, results);
    return results.affectedRows;
}

async function insertRows(q, params, db = 'default') {
    let [results, fields] = await getPool(db).execute(q, params)
    logDbCall(q, params, results);
    return results.affectedRows;
}

async function find(q, params, db = 'default') {
    let [rows, fields] = await getPool(db).execute(q, params);
    logDbCall(q, params, rows);
    return rows;
}

async function findAll(tableName, db = 'default') {
    let [rows, fields] = await getPool(db).execute(`select * from ${tableName}`, []);
    return rows;
}

async function callProcedure(name, db = 'default') {
    await getPool(db).execute(`call ${name}()`);
}

async function removeAll(tableName, db = 'default') {
    let q = `delete from ${tableName}`;
    await getPool(db).execute(q, []);
}

function logDbCall(q, params, rows) {
    //logger.info({query: q, params:params, rows:rows});
    //logger.debug({query: q}, {fn: "logDbCall"});
    console.log('logDbCall', {query: q, params, rows});
}

module.exports = {
    init,
    getPool,
    testConnection,
    getConnection,
    getSequelize,
    end,
    rawQuery,
    save,
    saveMany,
    findOne,
    deleteRows,
    insertRows,
    find,
    findAll,
    callProcedure,
    removeAll,
    logDbCall,
}
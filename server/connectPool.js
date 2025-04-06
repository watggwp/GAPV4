const mysql = require('mysql2')
require('dotenv').config().parsed

class ConnectionPool {
    pool = mysql.createPool({})
    
    createPool(config) {
        this.pool = mysql.createPool({
            connectionLimit: 10,
            host: process.env.HOST,
            user: config.user,
            password: config.password,
            database : process.argv[2] == process.env.BUILD ? process.env.DATABASE_SER : process.env.DATABASE_DEV,
            port : process.env.PORT || 3306,
        });
    }
    
    getPool() {
        return this.pool;
    }

    executeQuery(query, params) {
        return new Promise((resolve, reject) => {
            this.pool.query(query, params, (error, results) => {
                if (error) {
                    console.error('Error executing query:', error);
                    return reject(error);
                }
                resolve(results);
            });
        });
    }
    
    endPool() {
        if (this.pool) {
            this.pool.end((err) => {
                if (err) {
                    console.error('Error ending the connection pool:', err);
                } else {
                    console.log('Connection pool closed.');
                }
            });
        }
    }
}

module.exports = ConnectionPool
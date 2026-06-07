const mysql = require('mysql2');
require('dotenv').config({ path: '../.env' });

const config = {
    host: process.env.HOST_DB || 'localhost',
    user: process.env.USER_DBDEV || 'root',
    password: process.env.PASSWORD_DBDEV || '',
    database: process.env.DATABASE_DEV || 'gap_dev1163',
    port: 3306
};

const con = mysql.createConnection(config);

con.connect((err) => {
    if (err) {
        console.error("Connection failed:", err);
        process.exit(1);
    }
    console.log("Connected successfully!");

    // Let's add expected_yield and default_yield first
    const addColumnsQuery = `
    ALTER TABLE formplant
    ADD COLUMN expected_yield decimal(10,2) NULL,
    ADD COLUMN default_yield decimal(10,2) NULL;
    `;

    con.query(addColumnsQuery, (err, result) => {
        if (err) {
            console.log("expected_yield/default_yield may already exist or error occurred:", err.message);
        } else {
            console.log("Columns expected_yield and default_yield added successfully!");
        }

        // Apply column modifications
        const modifyQueries = [
            `ALTER TABLE formplant MODIFY generation int NULL`,
            `ALTER TABLE formplant MODIFY date_glow varchar(50) NULL`,
            `ALTER TABLE formplant MODIFY date_plant varchar(50) NOT NULL`,
            `ALTER TABLE formplant MODIFY posi_w float NULL`,
            `ALTER TABLE formplant MODIFY posi_h float NULL`,
            `ALTER TABLE formplant MODIFY qty int NULL`,
            `ALTER TABLE formplant MODIFY area float NULL`,
            `ALTER TABLE formplant MODIFY date_harvest varchar(50) NULL`,
            `ALTER TABLE formplant MODIFY system_glow varchar(50) NULL`,
            `ALTER TABLE formplant MODIFY water varchar(50) NULL`,
            `ALTER TABLE formplant MODIFY water_flow varchar(50) NULL`,
            `ALTER TABLE formplant MODIFY history varchar(50) NULL`,
            `ALTER TABLE formplant MODIFY insect varchar(50) NULL`,
            `ALTER TABLE formplant MODIFY qtyInsect varchar(50) NULL`,
            `ALTER TABLE formplant MODIFY seft varchar(200) NULL`,
            `ALTER TABLE formplant MODIFY state_status int NULL`,
            `ALTER TABLE formplant MODIFY date_success varchar(50) NULL`,
            `ALTER TABLE formplant MODIFY unit varchar(30) NULL`,
            `ALTER TABLE formplant MODIFY name_varieties varchar(50) NULL`
        ];

        let completed = 0;
        modifyQueries.forEach((q) => {
            con.query(q, (err, res) => {
                if (err) {
                    console.error("❌ Failed query:", q, "\nError:", err.message);
                } else {
                    console.log("✅ Executed:", q);
                }
                completed++;
                if (completed === modifyQueries.length) {
                    con.end();
                    console.log("All migrations finished!");
                }
            });
        });
    });
});

const mysql = require('mysql2');
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gap_dev1163'
});

const alterQuery = `
ALTER TABLE acc_doctor 
ADD COLUMN protection_role TINYINT(1) DEFAULT 0;
`;

pool.query(alterQuery, (err, result) => {
    if (err) {
        console.error("Error altering table:", err);
    } else {
        console.log("Table altered successfully!", result);
    }
    pool.end();
});

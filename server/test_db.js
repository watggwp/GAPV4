const mysql = require('mysql2');
require('dotenv').config({ path: '../.env' });

const config = {
    host: process.env.HOST_DB || 'localhost',
    user: process.env.USER_DBDEV || 'root',
    password: process.env.PASSWORD_DBDEV || '',
    database: process.env.DATABASE_DEV || 'gap_dev1163',
    port: 3306
};

console.log("Connecting with config:", config);

const con = mysql.createConnection(config);

con.connect((err) => {
    if (err) {
        console.error("Connection failed:", err);
        process.exit(1);
    }
    console.log("Connected successfully!");

    // 1. Get doctors
    con.query("SELECT id_table_doctor, id_doctor, fullname_doctor, station_doctor FROM acc_doctor", (err, doctors) => {
        if (err) console.error(err);
        console.log("\n--- Doctors ---");
        console.log(doctors);

        // 2. Get count of farmers grouped by register_auth and station
        con.query("SELECT station, register_auth, COUNT(*) as count FROM acc_farmer GROUP BY station, register_auth", (err, summary) => {
            if (err) console.error(err);
            console.log("\n--- Farmers Summary ---");
            console.log(summary);

            if (doctors && doctors.length > 0) {
                const doc = doctors[0];
                console.log(`\nTesting queries for doctor: ${doc.fullname_doctor} (ID: ${doc.id_table_doctor}, Station: ${doc.station_doctor})`);
                
                // Let's test the req.body.approve = 1 query (Checked / Verified Farmers)
                const queryType = `
                SELECT acc_farmer.id_table, acc_farmer.img, acc_farmer.fullname, acc_farmer.link_user, acc_farmer.date_register,
                       farmer_main.Count, acc_farmer.date_doctor_confirm, acc_farmer.uid_line,
                (
                    SELECT fullname_doctor
                    FROM acc_doctor
                    WHERE acc_doctor.id_table_doctor = acc_farmer.id_table_doctor
                ) as name_doctor,
                (
                    SELECT date FROM message_user
                    WHERE message_user.uid_line_farmer = (
                              SELECT uid_line FROM acc_farmer AS farmer_check
                              WHERE farmer_check.link_user = acc_farmer.link_user
                              ORDER BY date_register DESC
                              LIMIT 1
                          )
                          AND COALESCE(JSON_CONTAINS(id_read, '"read"', CONCAT('$."', ?, '"')), 0) = 0
                          AND type = ""
                    ORDER BY message_user.date DESC
                    LIMIT 1
                ) as is_msg
                FROM acc_farmer, 
                (
                    SELECT MAX(date_register) as DateLast, link_user, COUNT(link_user) as Count
                    FROM acc_farmer 
                    WHERE station = ? AND register_auth = 1
                    GROUP BY link_user
                ) as farmer_main
                WHERE acc_farmer.link_user = farmer_main.link_user 
                      AND acc_farmer.date_register = farmer_main.DateLast
                      AND (INSTR(acc_farmer.id_farmer, ?) OR INSTR(acc_farmer.fullname, ?))
                ORDER BY is_msg DESC, date_register DESC
                LIMIT 10;`;

                const queryParams = [doc.id_table_doctor, doc.station_doctor, "", ""];
                console.log("\nExecuting query with parameters:", queryParams);
                con.query(queryType, queryParams, (err, rows) => {
                    if (err) {
                        console.error("\n❌ SQL Error during execution:", err);
                    } else {
                        console.log(`\n✅ Query returned ${rows.length} rows:`);
                        console.log(rows);
                    }
                    con.end();
                });
            } else {
                con.end();
            }
        });
    });
});

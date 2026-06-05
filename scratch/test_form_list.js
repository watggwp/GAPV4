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

    const TextInsert = "";
    const station_doctor = "1"; // Test with station 1
    const TypePlant = [];
    const StatusFarmer = null;
    const Submit = null;
    const TypeDate = null;
    const StartDate = null;
    const EndDate = null;
    const OrderBy = "date_plant";
    const Limit = 10;

    const query = `
    SELECT fromInsert.* 
    FROM formplant ,
    (
        SELECT formplant.id , formplant.state_status , formplant.name_plant , formplant.date_plant ,
        formplant.system_glow , formplant.insect , formplant.generation , formplant.qty , formplant.date_harvest ,
        formplant.date_glow , formplant.posi_w , formplant.posi_h , formplant.area , formplant.unit , formplant.water , formplant.water_flow , formplant.expected_yield , formplant.default_yield ,
            (
                SELECT COUNT(id)
                FROM formfertilizer
                WHERE id_plant = formplant.id
            ) as ctFer ,
            (
                SELECT COUNT(id)
                FROM formchemical
                WHERE id_plant = formplant.id
            ) as ctChe ,
            (
                SELECT type_plant
                FROM plant_list
                WHERE name = formplant.name_plant
                LIMIT 1
            ) as type_main ,
            (
                SELECT id_plant
                FROM success_detail
                WHERE id_plant = formplant.id and INSTR(id_success , ?)
                GROUP BY id_plant
                LIMIT 1
            ) as success_id_plant ,
            (
                SELECT acc_farmer.fullname
                FROM acc_farmer
                WHERE acc_farmer.link_user = house.link_user AND station = ? AND register_auth != 2
                ORDER BY date_register DESC , register_auth DESC
                LIMIT 1
            ) as farmer
        FROM formplant , 
            (
                SELECT id_farm_house , farmer.link_user
                FROM housefarm , 
                    (
                        SELECT uid_line , link_user
                        FROM acc_farmer
                        WHERE ${StatusFarmer !== null ? `register_auth = ${StatusFarmer}` : "(register_auth = 0 OR register_auth = 1)"} AND station = ?
                    ) as farmer
                WHERE housefarm.uid_line = farmer.uid_line or housefarm.link_user = farmer.link_user
            ) as house
        WHERE formplant.id_farm_house = house.id_farm_house
                ${TypePlant.length == 1 ? `and formplant.name_plant = ?` : ""}
                ${Submit !== null ? `and formplant.state_status = ${Submit}` : ""}
                ${(TypeDate !== null && StartDate !== null && EndDate !== null) ? `and ( UNIX_TIMESTAMP(formplant.${TypeDate}) >= UNIX_TIMESTAMP('${StartDate}') and UNIX_TIMESTAMP(formplant.${TypeDate}) <= UNIX_TIMESTAMP('${EndDate}') )` : ""}
                
        ORDER BY ${OrderBy}
    ) as fromInsert
    WHERE formplant.id = fromInsert.id and ( INSTR(formplant.id , ?) or formplant.id = fromInsert.success_id_plant )
    ORDER BY state_status ASC
    ${(Limit !== null) ? `LIMIT ${Limit}` : ""}
    `;

    const params = [TextInsert, station_doctor, station_doctor, ...TypePlant, TextInsert];
    console.log("Executing query...");
    con.query(query, params, (err, rows) => {
        if (err) {
            console.error("❌ Query failed:", err);
        } else {
            console.log("✅ Query succeeded, row count:", rows.length);
        }
        con.end();
    });
});

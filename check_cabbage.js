const mysql = require('mysql2');
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gap_dev1163'
});

// 1. Search for Chinese cabbage (ผักกาดขาวปลี) in plant_list
pool.query("SELECT * FROM plant_list WHERE name LIKE '%ผักกาดขาวปลี%'", (err, plants) => {
    if (err) {
        console.error("Error plants:", err);
        pool.end();
        return;
    }
    console.log("Matching plants in plant_list:");
    console.log(JSON.stringify(plants, null, 2));

    if (plants.length === 0) {
        console.log("No plants matched!");
        pool.end();
        return;
    }

    const plantIds = plants.map(p => p.id);
    
    // 2. Search for schedules belonging to these plant IDs
    pool.query("SELECT * FROM schedules WHERE plant_id IN (?)", [plantIds], (err2, schedules) => {
        if (err2) {
            console.error("Error schedules:", err2);
        } else {
            console.log("\nSchedules found for these plants:");
            console.log(JSON.stringify(schedules, null, 2));
        }
        pool.end();
    });
});

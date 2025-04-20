require('dotenv').config();

module.exports = function apiSensor(app, Database, listDB) {
	app.post("/api/sensor", (req, res) => {
		// ลบ station_id
		const { device_id, timestamp, temperature, humidity, light, rainfall } = req.body;

		const conn = Database.createConnection(listDB);

		conn.query(
			`
                INSERT INTO weather_station
                    (device_id, timestamp, temperature, humidity, light, rainfall) 
                VALUES
                    (?, ?, ?, ?, ?, ?)
            `,
			[
				device_id,
				timestamp,
				temperature,
				humidity,
				light,
				rainfall
			],
			(err, result) => {
				if (err) {
					console.error("DB Error:", err);
					res.status(500).send("Failed to insert sensor data");
				} else {
					res.status(200).send("success");
				}
				conn.end();
			}
		);
	});
}

require('dotenv').config();

module.exports = function apiSensor(app, Database, listDB) {
	app.post("/api/sensor", (req, res) => {
		const { device_id, station_id, timestamp, temperature, humidity, light } = req.body;

		const conn = Database.createConnection(listDB);

		conn.query(
			`  
				INSERT INTO weather_station
					(device_id, station_id, timestamp, temperature, humidity, light) 
				VALUES
					(?, ? , ? , ? , ? , ?)
			`,
			[
				device_id,
				station_id,
				timestamp,
				temperature,
				humidity,
				light
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

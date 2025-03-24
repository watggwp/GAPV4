require('dotenv').config().parsed

module.exports = function apiSensor(app , Database , listDB) {
	app.post("/api/sensor/:housefarm_id" , (req , res) => {
		const { housefarm_id } = req.params
		const { device_id , application_id , temperature , humidity } = req.body
	
		const conn = Database.createConnection(listDB)
		conn.query(
			`  
				INSERT INTO sensor 
					(housefarm_id , device_id , application_id , temperature , humidity) 
				VALUES
					(? , ? , ? , ? , ?)
			` ,
			[
				housefarm_id,
				device_id,
				application_id,
				temperature,
				humidity
			],
			(err , result) => {
				err && console.log(err)
				conn.end()
				res.send("success")
			}
		)
	})
}
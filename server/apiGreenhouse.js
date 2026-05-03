'use strict';

require('dotenv').config();
const Pool = require("./connectPool");
const AuthorizeUser = require('./core/authorize');

module.exports = function apiGreenhouse(app, pool = new Pool()) {
    // gapv3
    app.get("/api/greenhouse/:greenhouse_id/gaps", async (req, res) => {
        console.log("✅ เข้ามาที่ /api/greenhouse/history แล้ว");

        const { params : { greenhouse_id } , query : { r : role , status } } = req

        const query = [ "gh.id_farm_house = ?" ]
        const params = [ greenhouse_id ]

        if(status !== undefined) {
            query.push("g.state_status = ?")
            params.push(status)
        }

        switch(role) {
            case "doctor" :
                const username = req.session.user_doctor;
                const password = req.session.pass_doctor;
            
                if (username === '' || password === '') {
                    return res.status(403).send({
                        errors : "authorize error"
                    })
                }
                break;
            case "farmer" :
                const uid = req.session.uidFarmer
                if (!uid) {
                    return res.status(403).send({
                        errors : "authorize error"
                    });
                }

                query.push("gh.uid_line = ?")
                params.push(uid)
                break;
            default :
                return res.status(403).send({
                    errors : "authorize error"
                });
        }
        
        try {
            const gaps = await pool.executeQuery(
                `
                    SELECT *
                    FROM formplant g
                    INNER JOIN housefarm gh ON gh.id_farm_house = g.id_farm_house
                    WHERE ${query.join(" AND ")}
                    ORDER BY date_plant DESC
                `,
                params,
            )
    
            return res.send({ gaps })
        } catch(err) {
            return res.status(500).send({
                error : "internal"
            })
        }
    })
}
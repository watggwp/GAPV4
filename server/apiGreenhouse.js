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
                const adminUser = req.session.user_username;
                const adminPass = req.session.user_password;
            
                if ((username === '' || password === '' || !username || !password) && (!adminUser || !adminPass)) {
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
                    SELECT g.id , g.id_farm_house , g.name_plant , g.generation , g.date_glow , g.date_plant ,
                        g.posi_w , g.posi_h , g.qty , g.area , g.date_harvest , g.system_glow , g.water ,
                        g.water_flow , g.history , g.insect , g.qtyInsect , g.seft , g.state_status ,
                        g.date_success , g.unit , g.name_varieties , g.expected_yield , g.default_yield ,
                        gh.uid_line , gh.link_user , gh.name_house , gh.location , gh.status
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
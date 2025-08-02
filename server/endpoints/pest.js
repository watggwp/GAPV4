'use strict';

require('dotenv').config();
const Pool = require("../connectPool")
const AuthorizeUser = require('../core/authorize');

module.exports = function Pests(app, pool = new Pool()) {
    app.get('/api/pests', async (req, res) => {

        // แยก role farmer , doctor , admin
        const username = req.session.user_doctor;
        const password = req.session.pass_doctor;
        const role = req.session.role_doctor;

        if(username === '' || password === '') {
            res.redirect('/api/logout')
            return 0
        }

        const Authen = new AuthorizeUser(pool)
        const { profile , verified } = await Authen.doctor(username , password , role)

        if(!verified) {
            return res.redirect('/api/logout')
        }

        try {
            const { plant_id } = req.query
            const pests = await pool.executeQuery(
                `
                    SELECT *
                    FROM pests p
                    LEFT JOIN pest_chemical pc ON pc.pest_id = p.pest_id
                    LEFT JOIN chemical_list cl ON cl.id = pc.chemical_id
                    WHERE p.is_use = 1 AND p.type_pest = "โรคพืช"
                `
            )

            return res.json(pests)
        } catch(err) {
            console.log(err)
            return res.json([])
        }
    })
}

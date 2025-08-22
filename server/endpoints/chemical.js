'use strict';

require('dotenv').config();
const Pool = require("../connectPool")
const AuthorizeUser = require('../core/authorize');

module.exports = function Fertilizer(app, pool = new Pool()) {
    app.get('/api/chemicals', async (req, res) => {

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
            const chemicals = await pool.executeQuery(
                `SELECT * FROM chemical_list WHERE is_use = 1`
            )

            return res.json({
                chemicals
            })
        } catch(err) {
            console.log(err)
            return res.json([])
        }
    })
}

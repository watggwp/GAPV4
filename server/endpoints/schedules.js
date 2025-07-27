'use strict';

require('dotenv').config();
const Pool = require("../connectPool")
const AuthorizeUser = require('../core/authorize');

module.exports = function Schedules(app, pool = new Pool()) {
    app.get('/api/schedules', async (req, res) => {

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
            const schedule_plants = await pool.executeQuery(
                `
                    SELECT pl.id , pl.name , COUNT(sp.id) as total_schedule
                    FROM plant_list as pl
                    LEFT JOIN schedules sp ON sp.plant_id = pl.id
                    WHERE pl.is_use = 1
                    GROUP BY pl.id , pl.name
                    ORDER BY pl.name
                `
            )

            return res.json(schedule_plants)
        } catch(err) {
            console.log(err)
            return res.json([])
        }
    })

    app.get('/api/schedules/:plant_id', async (req, res) => {

        const username = req.session.user_doctor;
        const password = req.session.pass_doctor;
        const role = req.session.role_doctor;

        const { plant_id } = req.params

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
            const plant_profile = await pool.executeQuery(
                `
                    SELECT pl.id , pl.name
                    FROM plant_list as pl
                    WHERE pl.id = ? AND pl.is_use = 1
                ` , [plant_id]
            )

            const schedule_plants = await pool.executeQuery(
                `
                    SELECT *
                    FROM schedules
                    WHERE plant_id = ?
                    ORDER BY age_plant ASC
                ` , [plant_id]
            )

            return res.json({
                plant_profile : plant_profile[0],
                schedule_plants : schedule_plants
            })
        } catch(err) {
            console.log(err)
            return res.json({
                plant_profile : undefined,
                schedule_plants : []
            })
        }
    })
}

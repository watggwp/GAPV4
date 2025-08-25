'use strict';

require('dotenv').config();
const Pool = require("../connectPool")
const AuthorizeUser = require('../core/authorize');
const uuid = require("uuid");
const RoyalGapEnv = require('../core/env');

module.exports = function Schedules(app, pool = new Pool()) {
    app.get('/api/schedules', async (req, res) => {
        const { account_type , profile : { station_doctor : station_id } = {} } = req.session
        try {
            const schedule_plants = await pool.executeQuery(
                `
                    SELECT pl.id , pl.name , (
                        SELECT COUNT(s.id)
                        FROM schedules s
                        WHERE s.plant_id = pl.id
                        ${RoyalGapEnv.access_type.doctor === account_type ? "AND s.station_id = ?" : ""}
                    ) as total_schedule
                    FROM plant_list as pl
                    WHERE pl.is_use = 1
                    GROUP BY pl.id , pl.name
                    ORDER BY pl.name
                ` , 
                RoyalGapEnv.access_type.doctor === account_type ? [ station_id ] : []
            )

            return res.json(schedule_plants)
        } catch(err) {
            console.log(err)
            return res.json([])
        }
    })

    app.get('/api/schedules/:plant_id', async (req, res) => {
        const { plant_id } = req.params
        const { s } = req.query

        try {
            const plant_profile = await pool.executeQuery(
                `
                    SELECT pl.id , pl.name
                    FROM plant_list as pl
                    WHERE pl.id = ? AND pl.is_use = 1
                ` , [plant_id]
            )

            const search = `%${s}%`

            const { account_type , profile : { station_doctor : station_id } = {} } = req.session
            const schedule_plants = await pool.executeQuery(
                `
                    SELECT 
                        s.* ,
                        IF(
                            s.category = 1,
                        	CONCAT(
                                '{',
                                    '"name_fertilizer":"', IFNULL(sdf.fertilizer, ''), '",',
                                    '"formula_fertilizer":"', IFNULL(sdf.formula_fertilizer, ''), '",',
                                    '"volume":"', IFNULL(sdf.volume, ''), '",',
                                    '"unit_volume":"', IFNULL(sdf.unit_volume, ''), '",',
                                    '"how_use":"', IFNULL(sdf.how_use, ''), '"'
                                ,'}'
                            ),
                            CONCAT(
                                '{',
                                    '"pest":"', IFNULL(sdd.pest, ''), '",',
                                    '"chemical":"', IFNULL(sdd.chemical, ''), '",',
                                    '"volume":"', IFNULL(sdd.volume, ''), '",',
                                    '"unit_volume":"', IFNULL(sdd.unit_volume, ''), '"'
                                ,'}'
                            )
                        ) AS details
                    FROM schedules s
                    LEFT JOIN schedules_detail_fertilizer sdf ON sdf.schedule_id = s.id
                    LEFT JOIN schedules_detail_disease sdd ON sdd.schedule_id = s.id
                    WHERE s.plant_id = ? 
                    ${
                        RoyalGapEnv.access_type.doctor === account_type ? 
                            "AND s.station_id = ?" : ""
                    }
                    ${
                        s &&
                            `
                                AND (
                                    s.title LIKE ? OR
                                    sdf.fertilizer LIKE ? OR
                                    sdf.formula_fertilizer LIKE ?
                                )
                            `
                    }
                    GROUP BY s.id
                    ORDER BY s.age_plant ASC , s.repeat ASC
                ` , [
                    plant_id ,
                    RoyalGapEnv.access_type.doctor === account_type ? [ station_id ] : [],
                    search , search , search
                ]
            )

            return res.json({
                plant_profile : plant_profile[0],
                schedule_plants : schedule_plants
            })
        } catch(err) {
            console.log(err)
            return res.json({
                plant_profile : {},
                schedule_plants : []
            })
        }
    })

    app.get('/api/schedules/:plant_id/:schedule_uid', async (req, res) => {
        try {
            const { plant_id , schedule_uid } = req.params

            const schedule_plant = await pool.executeQuery(
                `
                    SELECT 
                        s.* ,
                        IF(
                            s.category = 1,
                        	CONCAT(
                                '{',
                                    '"name_fertilizer":"', IFNULL(sdf.fertilizer, ''), '",',
                                    '"formula_fertilizer":"', IFNULL(sdf.formula_fertilizer, ''), '",',
                                    '"volume":"', IFNULL(sdf.volume, ''), '",',
                                    '"unit_volume":"', IFNULL(sdf.unit_volume, ''), '",',
                                    '"how_use":"', IFNULL(sdf.how_use, ''), '"'
                                ,'}'
                            ),
                            CONCAT(
                                '{',
                                    '"pest":"', IFNULL(sdd.pest, ''), '",',
                                    '"chemical":"', IFNULL(sdd.chemical, ''), '",',
                                    '"volume":"', IFNULL(sdd.volume, ''), '",',
                                    '"unit_volume":"', IFNULL(sdd.unit_volume, ''), '"'
                                ,'}'
                            )
                        ) AS details
                    FROM schedules s
                    LEFT JOIN schedules_detail_fertilizer sdf ON sdf.schedule_id = s.id
                    LEFT JOIN schedules_detail_disease sdd ON sdd.schedule_id = s.id
                    WHERE s.plant_id = ? AND s.uid = ?
                    GROUP BY s.id
                    ORDER BY s.age_plant ASC
                ` , [ plant_id , String(schedule_uid) ]
            )

            return res.json({
                schedule_plant : schedule_plant?.[0] || {}
            })
        } catch(err) {
            console.log(err)
            return res.status(403).json({
                schedule_plant : {}
            })
        }
    })
    
    app.post('/api/schedules', async (req, res) => {
        try {
            const { profile : { station_doctor : station_id } = {} } = req.session
            const { plant_id , category , title , details , age_plant , repeat } = req.body
            const schedule_uid = uuid.v4()
            const insert_schedule = await pool.executeQuery(
                "INSERT INTO schedules ( uid , plant_id , station_id , category , title , age_plant , `repeat` ) VALUES ( ? , ? , ? , ? , ? , ? , ? )" , 
                [ schedule_uid , plant_id , station_id , category , title , age_plant , repeat ? 1 : 0 ]
            )

            const { insertId , affectedRows } = insert_schedule

            const insert_detail_data = {
                table : "" ,
                columns : [],
                params : []
            }
            switch(category) {
                case 1 :
                    insert_detail_data["table"] = "schedules_detail_fertilizer"
                    insert_detail_data["columns"] = [ "fertilizer" , "formula_fertilizer" , "volume" , "unit_volume" , "how_use" ]
                    insert_detail_data["params"] = [
                        details.name_fertilizer ,
                        details.formula_fertilizer ,
                        details.volume ,
                        details.unit_volume ,
                        details.how_use
                    ]
                    break;
                case 2 :
                    insert_detail_data["table"] = "schedules_detail_disease"
                    insert_detail_data["columns"] = [ "pest" , "chemical" , "volume" , "unit_volume" ]
                    insert_detail_data["params"] = [
                        details.pest ,
                        details.chemical ,
                        details.volume ,
                        details.unit_volume
                    ]
                    break;
            }

            const { table , columns , params } = insert_detail_data

            if(!table || affectedRows !== 1) {
                await pool.executeQuery(
                    `
                        DELETE FROM schedules
                        WHERE id = ?
                    ` , [ insertId ]
                )

                return res.status(403).json({
                    insert_result : false
                })
            }

            try {
                await pool.executeQuery(
                    `
                        INSERT INTO ${table}
                            ( schedule_id , ${columns.join(" , ")} )
                            VALUES
                            ( ? , ${columns.map((_) => "?").join(" , ")} )
                    ` , [ insertId , ...params ]
                )
            } catch(err) {
                console.log(err)

                await pool.executeQuery(
                    `
                        DELETE FROM schedules
                        WHERE id = ?
                    ` , [ insertId ]
                )

                return res.status(403).json({
                    insert_result : false
                })
            }

            return res.json({
                insert_result : true
            })
        } catch(err) {
            console.log(err)
            return res.status(403).json({
                insert_result : false
            })
        }
    })

    app.put('/api/schedules/:plant_id/:schedule_uid', async (req, res) => {
        try {
            const { plant_id , schedule_uid } = req.params
            const { category , title , details , age_plant , repeat } = req.body

            await pool.executeQuery(
                "UPDATE schedules SET category = ? , title = ? , age_plant = ? , `repeat` = ? , last_update = NOW() WHERE plant_id = ? AND uid = ?" , 
                [ category , title , age_plant , repeat , plant_id , schedule_uid ]
            )

            const schedule_profile = await pool.executeQuery(
                `
                    SELECT id
                    FROM schedules
                    WHERE plant_id = ? AND uid = ?
                    LIMIT 1
                ` , 
                [ plant_id , schedule_uid ]
            )

            const { id : schedule_id } = schedule_profile?.[0] || {}

            const update_detail_data = {
                table : "" ,
                columns : [],
                params : []
            }

            const schedule_tables = new Set([
                "schedules_detail_fertilizer",
                "schedules_detail_disease"
            ])

            switch(category) {
                case 1 :
                    update_detail_data["table"] = "schedules_detail_fertilizer"
                    update_detail_data["columns"] = [ "fertilizer" , "formula_fertilizer" , "volume" , "unit_volume" , "how_use" ]
                    update_detail_data["params"] = [
                        details.name_fertilizer ,
                        details.formula_fertilizer ,
                        details.volume ,
                        details.unit_volume ,
                        details.how_use
                    ]
                    schedule_tables.delete("schedules_detail_fertilizer")
                    break;
                case 2 :
                    update_detail_data["table"] = "schedules_detail_disease"
                    update_detail_data["columns"] = [ "pest" , "chemical" , "volume" , "unit_volume" ]
                    update_detail_data["params"] = [
                        details.pest ,
                        details.chemical ,
                        details.volume ,
                        details.unit_volume
                    ]
                    schedule_tables.delete("schedules_detail_disease")
                    break;
            }

            const { table , columns , params } = update_detail_data

            if(!table || !schedule_id) {
                return res.status(403).json({
                    insert_result : false
                })
            }

            await pool.executeQuery(
                `
                    INSERT INTO ${table} (schedule_id , ${columns.join(" , ")})
                    VALUES (? , ${columns.map((_) => "?").join(" , ")})
                    ON DUPLICATE KEY UPDATE
                        ${columns.map((column) => `${column} = VALUES(${column})`).join(" , ")}
                ` ,
                [ schedule_id , ...params ]
            )

            for (const schedule_table_name of [...schedule_tables]) {
                await pool.executeQuery(
                    `
                        DELETE FROM ${schedule_table_name}
                        WHERE schedule_id = ?
                    ` ,
                    [ schedule_id ]
                )
            }

            return res.json({
                update_schedule_plant : true
            })
        } catch(err) {
            console.log(err)
            return res.status(403).json({
                update_schedule_plant : false
            })
        }
    })

    app.post('/api/schedules/:plant_id/:schedule_uid', async (req, res) => {
        try {
            const { plant_id , schedule_uid } = req.params

            const { user_doctor , role_doctor , user_admin , role_admin } = req.session
            const { password } = req.body

            const authorize = new AuthorizeUser(pool)
            const { verified } = await (
                role_doctor ?
                    authorize.doctor(user_doctor , password , role_doctor) :
                role_admin ?
                    new Promise((resolve) => resolve({
                        profile : {},
                        verified : true
                    })) :
                    new Promise((resolve) => resolve({
                        profile : {},
                        verified : false
                    }))
            )

            if(!verified) {
                return res.status(405).json({
                    schedule_plant_delete : false
                })
            }

            await pool.executeQuery(
                `
                    DELETE FROM schedules WHERE plant_id = ? AND uid = ?
                ` , [plant_id , String(schedule_uid)]
            )

            return res.json({
                schedule_plant_delete : true
            })
        } catch(err) {
            console.log(err)
            return res.status(403).json({
                schedule_plant_delete : false
            })
        }
    })
}

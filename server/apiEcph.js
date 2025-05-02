'use strict';

require('dotenv').config();
const Pool = require("./connectPool");
const AuthorizeUser = require('./core/authorize');

module.exports = function apiEcph(app, pool = new Pool()) {
    // gapv3
    app.get("/api/ecph/:id_formplant", async (req, res) => {
        console.log("✅ เข้ามาที่ /api/ecph/history แล้ว");

        const { params : { id_formplant } , query : { r : role } } = req

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
                break;
            default :
                return res.status(403).send({
                    errors : "authorize error"
                });
        }

        
        try {
            const history = await pool.executeQuery(
                `
                    SELECT id, timestamp, ec_value, ph_value 
                    FROM ecph 
                    WHERE id_formplant = ? 
                    ORDER BY timestamp DESC
                `,
                [id_formplant],
            )
    
            return res.send({ history })
        } catch(err) {
            return res.status(500).send({
                error : "internal"
            })
        }
    })

    app.post("/api/ecph/:id_formplant", async (req, res) => {
        const { params : { id_formplant } , body : { ec_value, ph_value } , query : { r : role } } = req

        if (!ec_value || !ph_value) return res.send("missing")

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
                break;
            default :
                return res.status(403).send({
                    errors : "authorize error"
                });
        }
        
        try {
            pool.executeQuery(
                `INSERT INTO ecph (id_formplant, ec_value, ph_value) VALUES (?, ?, ?)`,
                [id_formplant, ec_value, ph_value],
            )
    
            return res.send({ success: true })
        } catch(err) {
            return res.status(500).send({
                error : "เพิ่มข้อมูลไม่สำเร็จ"
            })
        }
    })

    app.put("/api/ecph/:id", async (req, res) => {

        const { params : { id } , body : { ec_value, ph_value } , query : { r : role } } = req

        if (!id) return res.status(404).send("missing")

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
                break;
            default :
                return res.status(403).send({
                    errors : "authorize error"
                });
        }

        
        try {
            const result = await pool.executeQuery(
                `UPDATE ecph SET ec_value = ?, ph_value = ? WHERE id = ?`,
                [ec_value, ph_value, id],
            )

            if (result.affectedRows === 0) return res.send({ success: false, message: "ไม่พบข้อมูลที่ต้องการแก้ไข" });
    
            return res.send({ success: true })
        } catch(err) {
            return res.status(500).send({
                error : "เพิ่มข้อมูลไม่สำเร็จ"
            })
        }
    })

    app.delete("/api/ecph/:id", async (req, res) => {

        const { params : { id } , query : { r : role } } = req

        if (!id) return res.status(404).send("missing")

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
                break;
            default :
                return res.status(403).send({
                    errors : "authorize error"
                });
        }

        
        try {
            const result = await pool.executeQuery(
                `DELETE FROM ecph WHERE id = ?`, [id],
            )

            if (result.affectedRows === 0) return res.send({ success: false, message: "ไม่พบข้อมูลที่จะลบ" });
    
            return res.send({ success: true })
        } catch(err) {
            return res.status(500).send({
                error : "เพิ่มข้อมูลไม่สำเร็จ"
            })
        }
    })
}
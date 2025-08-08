'use strict';

require('dotenv').config();
const Pool = require("../connectPool")

module.exports = function Pests(app, pool = new Pool()) {
    app.get('/api/pests', async (req, res) => {
        try {
            const pests = await pool.executeQuery(
                `
                    SELECT *
                    FROM pests p
                    LEFT JOIN pest_chemical pc ON pc.pest_id = p.pest_id
                    LEFT JOIN chemical_list cl ON cl.id = pc.chemical_id
                    WHERE p.is_use = 1 AND p.type_pest = "โรคพืช"
                `
            )

            return res.json({
                pests : pests
            })
        } catch(err) {
            console.log(err)
            return res.status(403).json([])
        }
    })
}

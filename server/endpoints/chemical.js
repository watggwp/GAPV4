'use strict';

require('dotenv').config();
const Pool = require("../connectPool")

module.exports = function Fertilizer(app, pool = new Pool()) {
    app.get('/api/chemicals', async (req, res) => {
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

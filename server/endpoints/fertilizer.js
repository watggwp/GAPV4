'use strict';

require('dotenv').config();
const Pool = require("../connectPool")

module.exports = function Fertilizer(app, pool = new Pool()) {
    app.get('/api/fertilizers', async (req, res) => {
        try {
            const fertilizers = await pool.executeQuery(
                `SELECT * FROM fertilizer_list WHERE is_use = 1`
            )

            return res.json(fertilizers)
        } catch(err) {
            console.log(err)
            return res.json([])
        }
    })
}

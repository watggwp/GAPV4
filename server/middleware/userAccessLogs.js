const ConnectPool = require("../connectPool");

module.exports = function UserAccessLogsGAP(connectionPool = new ConnectPool()) {
    return async (req, res, next) => {
        const { user_id, account_type } = req.session

        if (user_id && account_type) {
            try {
                await connectionPool.executeQuery(`
                    INSERT INTO user_access_logs ( user_id , user_type ) VALUES (? , ?)
                    ON DUPLICATE KEY UPDATE user_id = VALUES(user_id);
                ` , [user_id, account_type])
            } catch (err) {
                if (err.code !== 'ER_DUP_ENTRY') {
                    console.error('❌ User Access Log Error:', err);
                }
            }
        }

        next()
    }
}
const ConnectPool = require("../connectPool");

module.exports = function UserAccessLogsGAP(connectionPool = new ConnectPool()) {
    return async (req, res, next) => {
        const { user_id, account_type, admin_id, role_primary } = req.session

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

        if (role_primary === 'admin' && admin_id) {
            try {
                await connectionPool.executeQuery(`
                    INSERT INTO log_admin (admin_id)
                    SELECT ? FROM DUAL
                    WHERE NOT EXISTS (
                        SELECT 1 FROM log_admin
                        WHERE admin_id = ? AND DATE(date) = CURDATE()
                    )
                `, [admin_id, admin_id])
            } catch (err) {
                console.error('❌ Admin Access Log Error:', err);
            }
        }

        next()
    }
}
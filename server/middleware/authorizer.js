const ConnectPool = require("../connectPool");
const AuthorizeUser = require("../core/authorize");

module.exports = function Authorizer(connectionPool = new ConnectPool()) {
    return async (req , res , next) =>  {

        const { role_primary , role_doctor , uid_line } = req.session

        const username = role_primary === "admin" ? req.session.user_username : (req.session.user_doctor || req.session.user_username);
        const password = role_primary === "admin" ? req.session.user_password : (req.session.pass_doctor || req.session.user_password);

        if(username === '' || password === '') {
            return res.redirect('/api/logout')
        }

        const Authen = new AuthorizeUser(connectionPool)
        const { profile , verified } = await (
            role_doctor ? 
                Authen.doctor(username , password , role_doctor) :
            role_primary === "admin" ?
                Authen.admin(username , password) :
                Authen.farmer(uid_line)
        )

        if(!verified) {
            return res.redirect('/api/logout')
        }
        
        req.session.profile = profile
        next()
    }
}
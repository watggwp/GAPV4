const ConnectPool = require("../connectPool");
const AuthorizeUser = require("../core/authorize");

module.exports = function Authorizer(connectionPool = new ConnectPool()) {
    return async (req , res , next) =>  {

        const { role_doctor , role_admin , uid_line } = req.session

        const username = req.session.user_doctor;
        const password = req.session.pass_doctor;

        if(username === '' || password === '') {
            return res.redirect('/api/logout')
        }

        const Authen = new AuthorizeUser(connectionPool)
        const { profile , verified } = await (
            role_doctor ? 
                Authen.doctor(username , password , role_doctor) :
            role_admin ?
                new Promise((resolve) => resolve({ profile : {} , verified : true })) :
                Authen.farmer(uid_line)
        )

        if(!verified) {
            return res.redirect('/api/logout')
        }
        
        next()
    }
}
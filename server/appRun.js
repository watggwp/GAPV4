const appConfig = require("./configExpress")
const fs = require('fs')
module.exports = function appRun(username , password){
    console.log("Load Server...")
    const app = appConfig(username , password , process.env.URL_SERVER) 
    const Port = parseInt(process.env.REACT_APP_API_PORT ?? "80")
    app.listen( Port , "0.0.0.0" , function () {
        console.log('Start on port '+Port+'!\n');

        // if(process.argv[5]) {
        //     process.env.NGROk_URL = process.argv[5]
        //     console.log()
        // }
    });
}
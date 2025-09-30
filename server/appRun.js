const ngrok = require("@ngrok/ngrok")

const appConfig = require("./configExpress")
module.exports = function appRun(username , password){
    console.log("Load Server...")
    const app = appConfig(username , password , 
        process.env.URL_SERVER_CONTAINER || process.env.URL_SERVER
    ) 
    const Port = parseInt(process.env.REACT_APP_API_PORT ?? "80")
    app.listen( Port , "0.0.0.0" , async function () {
        console.log('Start on port '+Port+'!\n');

        if(process.env.NGROK_URL) {
            const listener = await ngrok.forward({
                addr: Port,
                domain: process.env.NGROK_URL,
                authtoken_from_env : true,
                onStatusChange: status => console.log("status", status),
                onLogEvent: log => console.log("ngrok log:", log),
            });
            
            console.log('Ngrok URL:', listener.url())
        }
    });
}
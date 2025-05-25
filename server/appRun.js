const ngrok = require("@ngrok/ngrok")

const appConfig = require("./configExpress")
module.exports = function appRun(username , password){
    console.log("Load Server...")
    const app = appConfig(username , password , process.env.URL_SERVER) 
    const Port = parseInt(process.env.REACT_APP_API_PORT ?? "80")
    app.listen( Port , "0.0.0.0" , async function () {
        console.log('Start on port '+Port+'!\n');

        if(process.env.NGROk_URL) {
            const listener = await ngrok.forward({
                addr: Port,
                domain: process.env.NGROk_URL,
            });
            
            console.log('Ngrok URL:', listener.url)
        }
    });
}
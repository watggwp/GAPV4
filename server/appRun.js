const ngrok = require("ngrok")

const appConfig = require("./configExpress")
module.exports = function appRun(username , password){
    console.log("Load Server...")
    const app = appConfig(username , password , process.env.URL_SERVER) 
    const Port = parseInt(process.env.REACT_APP_API_PORT ?? "80")
    app.listen( Port , "0.0.0.0" , async function () {
        console.log('Start on port '+Port+'!\n');

        if(process.env.NGROk_URL) {
            const ngrokGap = new ngrok.NgrokClient(process.env.NGROk_URL)

            const listener = await ngrokGap.startTunnel({
                addr : Port,
            })
            console.log('Ngrok URL:', listener.uri)
        }
    });
}
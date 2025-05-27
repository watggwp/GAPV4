import React from "react";
import ReactDOM from "react-dom/client";
import io from "socket.io-client";

import MainAdmin from "./src/main";
import ThemeProviderApp from "../../ThemeProvider";

const root = ReactDOM.createRoot(document.getElementById('root'))
// const socket = new WebSocket();
const socket = io(window.location.protocol+"//"+window.location.host)

// socket.on('connect' , ()=>{
    
// })

root.render(
    <ThemeProviderApp>
        <MainAdmin socket={socket}/>
    </ThemeProviderApp>
)

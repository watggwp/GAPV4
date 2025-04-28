import React from "react";
import ReactDOM  from "react-dom/client";
import io from "socket.io-client"

import MainDoctor from "./src/main";
import ThemeProviderApp from "../../ThemeProvider";

const root = ReactDOM.createRoot(document.getElementById('doctor'))
// const socket = new WebSocket();
const socket = io(
    process.env.NODE_ENV !== "development" ?
     process.env.REACT_APP_API_PUBLIC : `${process.env.REACT_APP_API_LOCAL}:${process.env.REACT_APP_API_PORT}`
)

// socket.on('connect' , ()=>{
    
// })
root.render(
    <ThemeProviderApp>
        <MainDoctor socket={socket}/>
    </ThemeProviderApp>
)

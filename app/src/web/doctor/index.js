import React from "react";
import ReactDOM  from "react-dom/client";
import io from "socket.io-client"

import MainDoctor from "./src/main";
import ThemeProviderApp from "../../ThemeProvider";

const root = ReactDOM.createRoot(document.getElementById('doctor'))
const socket = io(
    process.env.NODE_ENV !== "development" ?
<<<<<<< HEAD
    process.env.REACT_APP_API_PUBLIC : `${process.env.REACT_APP_API_LOCAL}:${process.env.REACT_APP_API_PORT}` ,
    {
        transports : ["websocket"]
    }
=======
    process.env.REACT_APP_API_PUBLIC : `${process.env.REACT_APP_API_LOCAL}:${process.env.REACT_APP_API_PORT}`
>>>>>>> b28deb0cc31480068be68f7e5053b16216c0f1b7
)

root.render(
    <ThemeProviderApp>
        <MainDoctor socket={socket}/>
    </ThemeProviderApp>
)

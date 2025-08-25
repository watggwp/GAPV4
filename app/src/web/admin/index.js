import React from "react";
import ReactDOM from "react-dom/client";
import io from "socket.io-client";

import MainAdmin from "./src/main";
import ThemeProviderApp from "../../ThemeProvider";

const root = ReactDOM.createRoot(document.getElementById('root'))
const socket = io(
    process.env.NODE_ENV !== "development" ?
    process.env.REACT_APP_API_PUBLIC : `${process.env.REACT_APP_API_LOCAL}:${process.env.REACT_APP_API_PORT}`
)

root.render(
    <ThemeProviderApp>
        <MainAdmin socket={socket}/>
    </ThemeProviderApp>
)

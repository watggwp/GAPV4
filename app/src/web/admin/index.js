import React from "react";
import ReactDOM from "react-dom/client";
import io from "socket.io-client";

import MainAdmin from "./src/main";
import ThemeProviderApp from "../../ThemeProvider";

import env from "../../env"
const { domain , subpath_server } = env
const socket = io(domain , { path : `${subpath_server}/socket.io` })

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
    <ThemeProviderApp>
        <MainAdmin socket={socket}/>
    </ThemeProviderApp>
)

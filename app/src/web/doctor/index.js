import ReactDOM  from "react-dom/client";
import io from "socket.io-client"

import MainDoctor from "./src/main";
import ThemeProviderApp from "../../ThemeProvider";

import env from "../../env"
const { domain , subpath_server } = env
const socket = io(domain , { path : `${subpath_server}/socket.io` })

const root = ReactDOM.createRoot(document.getElementById('doctor'))

root.render(
    <ThemeProviderApp>
        <MainDoctor socket={socket}/>
    </ThemeProviderApp>
)

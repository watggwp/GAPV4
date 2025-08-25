import ReactDOM  from "react-dom/client";
import Router from "./router";
import ThemeProviderApp from "../../ThemeProvider";
import SockectIO from "../../SocketIO";


// const socket = new WebSocket();
// const socket = io(window.location.protocol+"//"+window.location.host)

// socket.on('connect' , ()=>{
//     let Path = window.location.pathname.split("/").reverse()[0]
//     const id = {
//         "signup" : "1661049098-A9PON7LB" ,
//         "house" : "1661049098-Lm7mZW32" ,
//         "form" : "1661049098-GVZzbm5q"
//     }
//     ReactDOM.createRoot(document.getElementById('farmer')).render(<MainFarmer socket={socket} Path={Path} idLiff={id[Path]}/>)
// })

ReactDOM.createRoot(document.getElementById('farmer')).render(
    <ThemeProviderApp>
        <SockectIO>
            <Router/>
        </SockectIO>
    </ThemeProviderApp>
)


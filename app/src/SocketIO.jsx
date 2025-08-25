import { io } from "socket.io-client"

export const socket = io(
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

export default function SockectIO({
    children
}) {
    return(children)
}
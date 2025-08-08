import { io } from "socket.io-client"

export const socket = io(
    process.env.NODE_ENV !== "development" ?
    process.env.REACT_APP_API_PUBLIC : `${process.env.REACT_APP_API_LOCAL}:${process.env.REACT_APP_API_PORT}` ,
    {
        transports : ["websocket"]
    }
)

export default function SockectIO({
    children
}) {
    return(children)
}
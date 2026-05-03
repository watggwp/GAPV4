import { io } from "socket.io-client"

import env from "./env"
const { domain , subpath_server } = env
export const socket = io(domain , { path : `${subpath_server}/socket.io` })

export default function SockectIO({
    children
}) {
    return(children)
}
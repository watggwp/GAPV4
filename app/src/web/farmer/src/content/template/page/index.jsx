import { Box } from "@mui/material"
import { useCallback } from "react"
import { useNavigate } from "react-router"
import "./index.scss"

export default function TemplagePage({
    title,
    children,
    routerReturn
}) {
    const navigator = useNavigate()

    const onReturn = useCallback(() =>
        navigator(routerReturn)
    , [navigator, routerReturn])

    return(
        <section id="template-page-farmer">
            <div className="head">
                <div
                    className="return"
                    onClick={onReturn}
                >
                    <svg fill="#000000" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
                    <g fillRule="evenodd">
                        <path d="M1052 92.168L959.701 0-.234 959.935 959.701 1920l92.299-92.43-867.636-867.635L1052 92.168Z" />
                        <path d="M1920 92.168L1827.7 0 867.766 959.935 1827.7 1920l92.3-92.43-867.64-867.635L1920 92.168Z" />
                    </g>
                    </svg>
                </div>
                <Box
                    width={"100%"}
                >
                    {title}
                </Box>
            </div>
            {children}
        </section>
    )
}
import { Button, Grid, Stack, Typography } from "@mui/material"
import env from "../../../env"
import Devices from "./devices"
import { createContext, useCallback, useContext, useMemo, useState } from "react"

const { path_icon: { sensor_station, sensor_greenhouse, sensor_pump } } = env

export const categoriesMapping = {
    weather: 0,
    greenhouse: 1,
    pump: 2
}

export const categories = [
    {
        id: 'weather',
        title: 'สถานีวัดสภาพอากาศ',
        icon: sensor_station,
        color: '#d3b328',
        subColor: '#e9d88a',
        allowedRoles: ['admin'],
        path: "/api/sensor/weather-station"
    },
    {
        id: 'greenhouse',
        title: 'ชุดวัดสภาพแวดล้อมในโรงเรือน',
        icon: sensor_greenhouse,
        color: '#4caf50',
        subColor: '#a8e6a1',
        allowedRoles: ['admin', 'farmer'],
        path: "/api/sensor/weather-greenhouse"
    },
    {
        id: 'pump',
        title: 'ชุดควบคุมเครื่องสูบน้ำ',
        icon: sensor_pump,
        color: '#4e7ddc',
        subColor: '#acc3f2',
        allowedRoles: ['admin', 'farmer'],
        path: "/api/pump/"
    },
]

export const template = {
    devices: {
        path: "",
        query: {},
        pathParams: {},
        columnsData: {
            id: "",
            device_id: "",
            status: "",
        }
    },
    add: {
        path: "",
        query: {},
        pathParams: {},
        onAddComplete: () => { }
    },
    delete: {
        path: "",
        query: {},
        pathParams: {},
        typeDelete: "",
        onDeleteComplete: () => { }
    },
    status: {
        path: "",
        query: {},
        pathParams: {}
    }
}

const DeviceManagementContext = createContext({
    menuDatas: [
        { id: "weather", dataPage: template },
        { id: "greenhouse", dataPage: template },
        { id: "pump", dataPage: template }
    ],
    setPage: () => { },
})

export default function DeviceManagement({
    menuDatas = [
        {
            id: "weather",
            dataPage: template,
            stationSignature: ""
        },
        {
            id: "greenhouse",
            dataPage: template,
            greenhouse_id: ""
        },
        {
            id: "pump",
            dataPage: template,
            greenhouse_id: ""
        }
    ],
    role = "",
    onPageChange = null
}) {

    const [page, setPage] = useState(
        menuDatas.length === 1 ? menuDatas[0].id : "index"
    )

    const handleSetPage = useCallback((newPage) => {
        setPage(newPage)
        if (onPageChange) onPageChange(newPage)
    }, [onPageChange])

    const pageData = useMemo(() =>
        menuDatas.find(menu => menu.id === page)
        , [menuDatas, page])

    return (
        <Stack
            width={"100%"}
            height={"100%"}
        >
            <DeviceManagementContext.Provider
                value={{
                    menuDatas,
                    setPage: handleSetPage,
                }}
            >
                {
                    page === "index" ?
                        <DeviceManagementHome /> :
                        <Devices
                            title={categories[categoriesMapping[page]].title}
                            icon={categories[categoriesMapping[page]].icon}
                            color={categories[categoriesMapping[page]].color}
                            subColor={categories[categoriesMapping[page]].subColor}
                            dataDevices={pageData?.dataPage?.devices}
                            dataAdd={pageData?.dataPage?.add}
                            dataDelete={pageData?.dataPage?.delete}
                            dataStatus={pageData?.dataPage?.status}
                            isAll={pageData?.isAll}
                        />
                }
            </DeviceManagementContext.Provider>
        </Stack>
    )
}

function DeviceManagementHome() {

    const { setPage, menuDatas } = useDeviceManagement()

    const onSelectMenu = useCallback((page) => {
        setPage(page)
    }, [setPage])

    return (
        <Grid container spacing={2}>
            {
                menuDatas.map(({ id: idMenu }) => {
                    const { id, title, icon, color, subColor } = categories[categoriesMapping[idMenu]]

                    return (
                        <Grid key={id} size={{ xs: 12 }} justifyContent={"center"} display={"flex"}>
                            <Stack
                                sx={{
                                    width: "98%",
                                    maxWidth: "300px",
                                    borderRadius: 4,
                                    height: "120px",
                                    overflow: "hidden"
                                }}
                            >
                                <Stack width={"100%"} height={"100%"} overflow={"hidden"} direction={"row"} bgcolor={subColor}>
                                    <Stack width={"30%"} height={"100%"} padding={1} bgcolor={color}>
                                        <img src={icon} width={"100%"} height={"100%"} alt={title} />
                                    </Stack>
                                    <Stack width={"70%"} height={"100%"} justifyContent={"space-between"}>
                                        <Stack padding={1.5} height={"calc(100% - 50px)"} justifyContent={"center"}>
                                            <Typography fontSize={"18px"}>{title}</Typography>
                                        </Stack>
                                        <Stack justifyContent={"center"} alignItems={"center"} height={"50px"}>
                                            <Button onClick={() => onSelectMenu(id)} size="small" variant="contained" >จัดการอุปกรณ์</Button>
                                        </Stack>
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Grid>
                    )
                })
            }
        </Grid>
    )
}

export function useDeviceManagement() {
    return useContext(DeviceManagementContext)
}
import { Button, Grid, Stack, Typography } from "@mui/material"
import env from "../../../env"
import Devices from "./devices"
import { createContext, useCallback, useContext, useMemo, useState } from "react"

const { path_icon : { sensor_station , sensor_greenhouse , sensor_pump } } = env

export const categoriesMapping = {
    weather : 0,
    greenhouse : 1,
    pump : 2
}

export const categories = [
    {
        id: 'weather',
        title: 'สถานีวัดสภาพอากาศ',
        icon: sensor_station,
        color: '#d3b328',
        subColor: '#e9d88a',
        allowedRoles: ['admin'],
    },
    {
        id: 'greenhouse',
        title: 'ชุดวัดสภาพแวดล้อมในโรงเรือน',
        icon: sensor_greenhouse,
        color: '#4caf50',
        subColor: '#a8e6a1',
        allowedRoles: ['admin', 'farmer'],
    },
    {
        id: 'pump',
        title: 'ชุดควบคุมเครื่องสูบน้ำ',
        icon: sensor_pump,
        color: '#4e7ddc',
        subColor: '#acc3f2',
        allowedRoles: ['admin', 'farmer'],
    },
]

export const template = { 
    devices : {
        path : "",
        query : {},
        pathParams : {},
        columnsData : {
            id : "",
            device_id : "",
            status : "",
        }
    } , 
    add : {
        path : "",
        query : {},
        pathParams : {}
    } , 
    delete : {
        path : "",
        query : {},
        pathParams : {},
        typeDelete : ""
    } , 
    status : {
        path : "",
        query : {},
        pathParams : {}
    } 
}

const DeviceManagementContext = createContext({
    menuDatas : [ 
        { id : "weather" , endpoints : template } , 
        { id : "greenhouse" , endpoints : template } , 
        { id : "pump" , endpoints : template }
    ],
    setPage : () => {},
})

export default function DeviceManagement({
    menuDatas = [ 
        { 
            id : "weather" , 
            endpoints : template
        } , 
        { 
            id : "greenhouse" , 
            endpoints : template
        } , 
        { 
            id : "pump" , 
            endpoints : template
        }
    ],
}) {

    const [ page , setPage ] = useState("index")

    const pageData = useMemo(() => 
        menuDatas.find(menu => menu.id === page)?.endpoints
    , [menuDatas, page])

    return(
        <Stack
            width={"100%"}
            height={"100%"}
        >
            <DeviceManagementContext.Provider
                value={{
                    menuDatas,
                    setPage,
                }}
            >
                {
                    page === "index" ?
                        <DeviceManagementHome/> :
                        <Devices
                            title={categories[categoriesMapping[page]].title}
                            icon={categories[categoriesMapping[page]].icon}
                            color={categories[categoriesMapping[page]].color}
                            subColor={categories[categoriesMapping[page]].subColor}
                            dataDevices={pageData?.devices}
                            dataAdd={pageData?.add}
                            dataDelete={pageData?.delete}
                            dataStatus={pageData?.status}
                        />
                }
            </DeviceManagementContext.Provider>
        </Stack>
    )
}

function DeviceManagementHome() {

    const { setPage , menuDatas } = useDeviceManagement()

    const onSelectMenu = useCallback((page) => {
        setPage(page)
    } , [setPage])

    return(
        <Grid container spacing={2}>
            {
                menuDatas.map(({ id : idMenu }) => {
                    const { id , title , icon , color , subColor , allowedRoles } = categories[categoriesMapping[idMenu]]

                    return(
                        <Grid key={id} size={{ xs : 12 , sm : 4 }} >
                            <Stack
                                sx={{
                                    width : "98%",
                                    maxWidth : "300px",
                                    borderRadius : 4,
                                    height : "120px",
                                    overflow : "hidden"
                                }}
                            >
                                <Stack width={"100%"} height={"100%"} overflow={"hidden"} direction={"row"} bgcolor={subColor}>
                                    <Stack width={"30%"} height={"100%"} padding={1} bgcolor={color}>
                                        <img src={icon} width={"100%"} height={"100%"} alt={title} />
                                    </Stack>
                                    <Stack width={"70%"} height={"100%"} justifyContent={"space-between"}>
                                        <Stack padding={1.5} height={"calc(100% - 50px)"} justifyContent={"center"}>
                                            <Typography fontSize={"14px"}>{title}</Typography>
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
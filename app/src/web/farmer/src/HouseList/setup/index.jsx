import React, { useCallback, useEffect, useState } from "react";
import DeviceManagement, { categories, categoriesMapping } from "../../../../../assets/components/device-management";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { Stack, Button, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router";
import env from "../../../../../env";

const { icon: { replyAll: Back } } = env;

export default function HouseSetup() {
    const { greenhouse_id } = useParams()
    const navigator = useNavigate()
    const [pageTitle, setPageTitle] = useState("ตั้งค่าโรงเรือน")
    const [activePage, setActivePage] = useState("index")

    useEffect(() => {
        clientMo.unLoadingPage()
    }, [])

    const handlePageChange = useCallback((newPage) => {
        setActivePage(newPage)
        if (newPage === "index") {
            setPageTitle("ตั้งค่าโรงเรือน")
        } else {
            const cat = categories[categoriesMapping[newPage]]
            setPageTitle(cat ? `ตั้งค่า${cat.title}` : "ตั้งค่าโรงเรือน")
        }
    }, [])

    return (
        <React.Fragment>
            {/* Dynamic page title */}
            <div className="title" style={{ marginBottom: "8px" }}>
                {pageTitle}
            </div>

            <Stack paddingTop={2} flex={1} width="100%" height="100%">
                <DeviceManagement
                    onPageChange={handlePageChange}
                    menuDatas={[
                        {
                            id: "greenhouse",
                            dataPage: {
                                devices: {
                                    path: `/api/sensor/weather-greenhouse/:greenhouse_id`,
                                    query: { r: "farmer" },
                                    pathParams: { greenhouse_id },
                                    columnsData: { id: "id", device_id: "device_id", status: "status" }
                                },
                                add: {
                                    path: "/api/sensor/weather-greenhouse/:greenhouse_id",
                                    query: { r: "farmer" },
                                    pathParams: { greenhouse_id },
                                },
                                delete: {
                                    path: "/api/sensor/weather-greenhouse",
                                    query: { r: "farmer" },
                                    typeDelete: "unregister"
                                }
                            }
                        },
                        {
                            id: "pump",
                            dataPage: {
                                devices: {
                                    path: `/api/pump/:greenhouse_id`,
                                    query: { r: "farmer" },
                                    pathParams: { greenhouse_id },
                                    columnsData: { id: "id", device_id: "device_id", status: "status" }
                                },
                                add: {
                                    path: "/api/pump/:greenhouse_id",
                                    query: { r: "farmer" },
                                    pathParams: { greenhouse_id },
                                },
                                delete: {
                                    path: "/api/pump/",
                                    query: { r: "farmer" },
                                    typeDelete: "unregister"
                                }
                            }
                        }
                    ]}
                />
                {activePage === "index" && (
                    <Stack direction={"row"} marginTop={2} marginBottom={1} justifyContent={"center"}>
                        <Button onClick={() => navigator("/farmer/houses")} sx={{ width: "100px", display: "flex", justifyContent: "center", alignItems: "center" }} variant="contained" size="small">
                            <Back />
                            <Typography marginLeft={1} fontSize={"12px"}>ย้อนกลับ</Typography>
                        </Button>
                    </Stack>
                )}
            </Stack>
        </React.Fragment>
    )
}
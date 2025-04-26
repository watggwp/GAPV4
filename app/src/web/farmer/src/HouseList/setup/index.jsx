import { useEffect } from "react";
import DeviceManagement from "../../../../../assets/components/device-management";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { Stack } from "@mui/material";
import { useParams } from "react-router";

export default function HouseSetup() {
    const { greenhouse_id } = useParams()

    useEffect(() => {
        clientMo.unLoadingPage()
    } , [])

    return(
        <Stack
            width={"100%"}
            height={"100%"}
            paddingTop={2}
        >
            <DeviceManagement
                menuDatas={[
                    {
                        id : "greenhouse",
                        endpoints : {
                            devices : {
                                path : `/api/sensor/weather-greenhouse/:greenhouse_id`,
                                query : {
                                    r : "farmer"
                                },
                                pathParams : {
                                    greenhouse_id
                                }
                            }
                        }
                    },
                    {
                        id : "pump"
                    }
                ]}
            />
        </Stack>
    )
}
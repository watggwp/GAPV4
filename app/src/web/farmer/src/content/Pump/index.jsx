import React, { useCallback, useState } from "react";
import PumpManagement from "../../../../../assets/components/pump-management";
import TemplagePage from "../template/page";
import { IconButton, Stack } from "@mui/material";
import env from "../../../../../env";
import { useParams } from "react-router";

const { icon : { history : History } } = env

export default function PumpControlPage() {

    const { greenhouse_id , gap_id } = useParams()
    const [ openHistory , setOpenHistory ] = useState(false)

    const onOpenHistory = useCallback(() => {
        setOpenHistory(true)
    } , [])

    return(
        <TemplagePage
            title={
                <Stack direction={"row"} justifyContent={"center"} alignItems={"center"} width={"100%"} paddingLeft={"40px"}>
                    {"ควบคุมปั้ม"}
                    <IconButton size="small" sx={{ marginLeft : 2 }} onClick={onOpenHistory}>
                        <History/>
                    </IconButton>
                </Stack>
            }
            routerReturn={`/farmer/form/${greenhouse_id}/${gap_id}/p`}
        >
            <PumpManagement
                showHistory={openHistory}
                setShowHistory={setOpenHistory}
            />
        </TemplagePage>
    )
}

import { Grid2, TextField } from "@mui/material";
import React, { useContext } from "react";
import { MapsJSX } from "../../../../../../assets/js/module";
import { PopupManagePageContext } from "../ManagePage";

export default function Station() {
    const { Data } = useContext(PopupManagePageContext)
    return(
        <React.Fragment>
            <Grid2 size={{ xs : 12 }}>
                <MapsJSX lat={Data.location.x} lng={Data.location.y} w={"300vw"} h={"80vw"}/>
            </Grid2>
        </React.Fragment>
    )
}
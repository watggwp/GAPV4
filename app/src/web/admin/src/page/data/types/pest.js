import { Grid2, TextField, Typography } from "@mui/material";
import React, { useContext } from "react";
import { PopupManagePageContext } from "../ManagePage";

export default function Pest() {
    const { Data } = useContext(PopupManagePageContext)
    return(
        <React.Fragment>
            <Typography fontWeight={900} marginRight={"8px"}>{Data.type_pest}</Typography>
            <Typography>{Data.pest_name}</Typography>
        </React.Fragment>
    )
}
import { Grid, TextField, Typography } from "@mui/material";
import React, { useContext } from "react";
import { PopupManagePageContext } from "../ManagePage";
import { Box } from "@mui/material";

export default function Pest() {
    const { Data } = useContext(PopupManagePageContext)
    return(
        <Box sx={{ display: "flex", alignItems: "center", paddingLeft: "15px" }}>
        <Typography sx={{ fontWeight: 900, fontFamily: "Sans-font", marginRight: "10px" }}>
            {Data.type_pest}
        </Typography>
        <Typography sx={{ fontFamily: "Sans-font" }}>
            {Data.pest_name}
        </Typography>
    </Box>
    
    
    

    )
}
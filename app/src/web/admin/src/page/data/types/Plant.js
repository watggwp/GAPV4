import { Grid2, TextField } from "@mui/material";
import React from "react";

export default function Plant({ Data }) {
    // data.type_plant : type === "plant" ? data.variety_name :  type === "station" ? data.location : ""
    return(
        <React.Fragment>
            <Grid2 size={{ sm : 12 , md : 6 }}>
                <TextField
                    label="ชื่อพืช"
                    variant="outlined"
                    value={Data.name}
                />
            </Grid2>
            <Grid2 size={{ sm : 12 , md : 6 }}>
                <TextField
                    label="ชนิดพืช"
                    variant="outlined"
                    value={Data.type_plant}
                />
            </Grid2>
            <Grid2 size={{ sm : 12 , md : 6 }}>
                <TextField
                    label="สายพันธ์ุพืช"
                    variant="outlined"
                    value={Data.variety_name}
                />
            </Grid2>
        </React.Fragment>
    )
}
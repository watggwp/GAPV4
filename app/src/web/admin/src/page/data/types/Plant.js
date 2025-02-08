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
                    defaultValue={Data.name}
                    slotProps={{
                        htmlInput : {
                            readOnly : true
                        }
                    }}
                />
            </Grid2>
            <Grid2 size={{ sm : 12 , md : 6 }}>
                <TextField
                    label="ชนิดพืช"
                    variant="outlined"
                    defaultValue={Data.type_plant}
                    slotProps={{
                        htmlInput : {
                            readOnly : true
                        }
                    }}
                />
            </Grid2>
            <Grid2 size={{ xs : 12 }}>
                <TextField
                    label="สายพันธ์ุพืช"
                    variant="outlined"
                    defaultValue={Data.variety_name}
                    slotProps={{
                        htmlInput : {
                            readOnly : true
                        }
                    }}
                />
            </Grid2>
        </React.Fragment>
    )
}
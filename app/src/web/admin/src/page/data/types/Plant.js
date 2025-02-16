import { Grid2, TextField } from "@mui/material";
import React, { useContext } from "react";
import { PopupManagePageContext } from "../ManagePage";


export default function Plant() {
    const { Data } = useContext(PopupManagePageContext)
    return(
        <React.Fragment>
            <Grid2 container spacing={{ xl : 1 }}>
                <Grid2 size={{ sm : 12 , md : 6 }}>
                    <TextField
                        label="ชื่อพืช"
                        variant="outlined"
                        value={Data.name}
                        slotProps={{
                            htmlInput : {
                                readOnly : true
                            },
                            inputLabel : {
                                shrink : true
                            }
                        }}
                    />
                </Grid2>
                <Grid2 size={{ sm : 12 , md : 6 }}>
                    <TextField
                        label="ชนิดพืช"
                        variant="outlined"
                        value={Data.type_plant}
                        slotProps={{
                            htmlInput : {
                                readOnly : true
                            },
                            inputLabel : {
                                shrink : true
                            }
                        }}
                    />
                </Grid2>
            </Grid2>
            <Grid2 container spacing={{ xs : 1 }}>
                <Grid2 size={{ xs : 12 }}>
                    <TextField
                        label="สายพันธ์ุพืช"
                        variant="outlined"
                        value={Data.variety_name}
                        slotProps={{
                            htmlInput : {
                                readOnly : true
                            },
                            inputLabel : {
                                shrink : true
                            }
                        }}
                        fullWidth
                    />
                </Grid2>
            </Grid2>
        </React.Fragment>
    )
}
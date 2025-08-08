import { Grid, TextField } from "@mui/material";
import React, { useContext } from "react";
import { PopupManagePageContext } from "../ManagePage";


export default function Plant() {
    const { Data } = useContext(PopupManagePageContext)
    return(
        <React.Fragment>
            <Grid container spacing={{ xl : 1 }}>
                <Grid size={{ sm : 12 , md : 6 }}>
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
                </Grid>
                <Grid size={{ sm : 12 , md : 6 }}>
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
                </Grid>
            </Grid>
            <Grid container spacing={{ xs : 1 }}>
                <Grid size={{ xs : 12 }}>
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
                </Grid>
            </Grid>
        </React.Fragment>
    )
}
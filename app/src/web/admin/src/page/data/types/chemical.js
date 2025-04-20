import { Grid, TextField } from "@mui/material";
import React, { useContext } from "react";
import { PopupManagePageContext } from "../ManagePage";

export default function Chemical() {
    const { Data } = useContext(PopupManagePageContext)
    return(
        <React.Fragment>
            <Grid container spacing={{ xl : 1 }}>
                <Grid size={{ sm : 12 , md : 6 }}>
                    <TextField
                        label="ชื่อสารเคมี"
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
                        label="ชื่อสามัญสารเคมี"
                        variant="outlined"
                        value={Data.name_formula}
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
                        label="วิธีการใช้"
                        variant="outlined"
                        value={Data.how_use}
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
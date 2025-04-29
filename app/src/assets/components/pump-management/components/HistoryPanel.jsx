import React from 'react';
import PopupApp from '../../PopupApp';
import { Chip, IconButton, Stack, Typography } from '@mui/material';
import env from '../../../../env';
import { usePumpManagement } from '..';

const { icon : { close : Close } } = env

export default function HistoryPanel({ show, onClose }) {

    const { logs } = usePumpManagement()

    return(
        <PopupApp
            open={show}
            onClose={onClose}
        >
            <Stack
                id="pump-management-history"
                width={"calc(100% - 32px)"}
                height={"calc(100% - 32px)"}
                bgcolor={"white"}
                borderRadius={4}
            >
                <div className="history-header">
                    <h3>ประวัติย้อนหลัง</h3>
                    <IconButton size='small' sx={{ position : "absolute" , right : "10px" }} onClick={onClose}>
                        <Close/>
                    </IconButton>
                </div>
                <div className="history-content">
                    {
                        logs.length === 0 ? (
                            <p style={{ textAlign : "center" }}>ยังไม่มีประวัติ</p>
                        ) : (
                            <>
                                <h4>⏱️ ประวัติ Manual</h4>
                                {
                                    logs.filter(item => item.source === 'manual').length === 0 ? (
                                        <p>ไม่มีรายการ Manual</p>
                                    ) : (
                                    logs
                                        .filter(item => item.source === 'manual')
                                        .map((item, idx) => {
                                            const { action , timestamp } = item

                                            const datetime = new Date(timestamp)
                                            return (
                                                <div key={`manual-${idx}`} className="history-item">
                                                    <Chip
                                                        sx={{ width : "100%" }}
                                                        label={
                                                            <Typography>{action === "on" ? "เปิด" : "ปิด"}</Typography>
                                                        }
                                                        color="secondary"
                                                    />
                                                    <Stack direction={"row"} justifyContent={"space-between"} marginTop={1}>
                                                        <Typography>{ datetime.toLocaleDateString("th-TH") }</Typography>
                                                        <Typography>{ datetime.toLocaleTimeString("th-TH") }</Typography>
                                                    </Stack>
                                                </div>
                                            )
                                        })
                                    )
                                }
                                <h4>📅 ประวัติ Schedule</h4>
                                {
                                    logs.filter(item => item.source !== 'manual').length === 0 ? (
                                        <p>ไม่มีรายการ Schedule</p>
                                    ) : (
                                    logs
                                        .filter(item => item.source !== 'manual')
                                        .map((item, idx) => {
                                            const { action , timestamp } = item

                                            const datetime = new Date(timestamp)
                                            return (
                                                <div key={`manual-${idx}`} className="history-item">
                                                    <Chip
                                                        sx={{ width : "100%" }}
                                                        label={
                                                            <Typography>{action === "on" ? "เปิด" : "ปิด"}</Typography>
                                                        }
                                                        color="secondary"
                                                    />
                                                    <Stack direction={"row"} justifyContent={"space-between"} marginTop={1}>
                                                        <Typography>{ datetime.toLocaleDateString("th-TH") }</Typography>
                                                        <Typography>{ datetime.toLocaleTimeString("th-TH") }</Typography>
                                                    </Stack>
                                                </div>
                                            )
                                        })
                                    )
                                }
                            </>
                        )
                    }
                </div>
            </Stack>
        </PopupApp>
    )
}

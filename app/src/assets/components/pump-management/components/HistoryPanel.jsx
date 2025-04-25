import React from 'react';
import PopupApp from '../../PopupApp';
import { IconButton, Stack } from '@mui/material';
import env from '../../../../env';

const { icon : { close : Close } } = env

export default function HistoryPanel({ show, onClose, schedules }) {
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
                        schedules.length === 0 ? (
                            <p>ยังไม่มีประวัติ</p>
                        ) : (
                            <>
                                <h4>⏱️ ประวัติ Manual</h4>
                                {
                                    schedules.filter(item => item.source === 'manual').length === 0 ? (
                                        <p>ไม่มีรายการ Manual</p>
                                    ) : (
                                    schedules
                                        .filter(item => item.source === 'manual')
                                        .map((item, idx) => (
                                        <div key={`manual-${idx}`} className="history-item">
                                            <strong>{item.date}</strong><br />
                                            เปิด {item.time} - ปิด {item.endTime}<br />
                                            เป็นเวลา {item.duration} นาที
                                        </div>
                                        ))
                                    )
                                }
                                <h4>📅 ประวัติ Schedule</h4>
                                {
                                    schedules.filter(item => item.source !== 'manual').length === 0 ? (
                                        <p>ไม่มีรายการ Schedule</p>
                                    ) : (
                                    schedules
                                        .filter(item => item.source !== 'manual')
                                        .map((item, idx) => (
                                        <div key={`schedule-${idx}`} className="history-item">
                                            <strong>{item.date}</strong><br />
                                            เปิด {item.time} เป็นเวลา {item.duration} นาที
                                        </div>
                                        ))
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

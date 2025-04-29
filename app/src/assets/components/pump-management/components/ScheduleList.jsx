import { Stack, Typography } from '@mui/material';
import React from 'react';

export default function ScheduleList({ schedules, onDelete }){
    return (
        <div className="schedule-list" style={{ paddingTop : 16 }}>
            <h3>รายการตั้งค่า</h3>
            {
                schedules.map((item, index) => (
                    <div key={index} className="schedule-item">
                        <Stack justifyContent={"center"} alignItems={"start"}>
                            <Typography>เปิด {item.start_time}</Typography>
                            <Typography>เป็นเวลา {item.duration} นาที</Typography>
                        </Stack>
                        <button onClick={() => onDelete(item.id)}>ลบ</button>
                    </div>
                ))
            }
        </div>
    );
}

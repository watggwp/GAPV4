import React, { useState } from 'react';
import ScheduleList from './ScheduleList';
import ToggleSwitch from './ToggleSwitch';
import { Box } from '@mui/material';

export default function ScheduleControl({ schedules, setSchedules, enableSchedule, setEnableSchedule }) {
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState('');

    const handleAdd = () => {
        if (time && duration) {
            const now = new Date();
            const dateStr = now.toLocaleDateString('th-TH')

            setSchedules(prev => [...prev, { time, duration, date: dateStr }]);
            setTime('');
            setDuration('');
        }
    };

    const handleDelete = (index) => {
        setSchedules(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <Box className="section control-box" bgcolor={"secondary.main"}>
            <div className="state-label">
                <span className={`state-dot ${enableSchedule ? 'on' : 'off'}`}></span>
                <span className="state-text">STATE {enableSchedule ? 'ON' : 'OFF'}</span>
            </div>

            <h2>ตั้งเวลา เปิด-ปิด ปั๊ม</h2>
            <ToggleSwitch isOn={enableSchedule} onToggle={() => setEnableSchedule(!enableSchedule)} />
            {
                enableSchedule && (
                    <>
                        <div className="input-group">
                            <label>เวลา</label>
                            <input type="time" value={time} onChange={e => setTime(e.target.value)} />
                            <label>จำนวน (นาที)</label>
                            <input type="number" value={duration} onChange={e => setDuration(e.target.value)} />
                            <button className="add-button" onClick={handleAdd}>เพิ่ม</button>
                        </div>
                        <ScheduleList schedules={schedules} onDelete={handleDelete} />
                    </>
                )
            }
        </Box>
    );
};

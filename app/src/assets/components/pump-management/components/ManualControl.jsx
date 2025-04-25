import React, { useState, useRef, useCallback } from 'react';
import ToggleSwitch from './ToggleSwitch';
import { Box } from '@mui/material';

export default function ManualControl({
    addManualHistory
}) {
    const [ isOn, setIsOn ] = useState(false);
    const startTimeRef = useRef(null);

    const handleToggle = useCallback(() => {
        const now = new Date();

        if (!isOn) {
            startTimeRef.current = now;
        } else {
            const endTime = now;
            const startTime = startTimeRef.current;

            if (startTime) {
                const durationMs = endTime - startTime;
                const durationMinutes = Math.round(durationMs / 60000);

                const formatTime = (date) =>
                date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

                addManualHistory(formatTime(startTime), formatTime(endTime), durationMinutes);
            }
        }

        setIsOn(prev => !prev);
    } , [addManualHistory, isOn])

    return (
        <Box className="section control-box" bgcolor={"secondary.main"}>
            <div className="state-label">
                <span className={`state-dot ${isOn ? 'on' : 'off'}`}></span>
                <span className="state-text">STATE {isOn ? 'ON' : 'OFF'}</span>
            </div>

            <h2>เปิด-ปิด ปั๊ม</h2>
            <ToggleSwitch isOn={isOn} onToggle={handleToggle} />
        </Box>
    );
}

import React, { useState } from 'react';
import ManualControl from './components/ManualControl';
import ScheduleControl from './components/ScheduleControl';
import HistoryPanel from './components/HistoryPanel';
import "./indax.scss";

export default function PumpManagement({
    greenhouse_id,
    role,
    showHistory,
    setShowHistory
}) {
    const [schedules, setSchedules] = useState([]);
    const [enableSchedule, setEnableSchedule] = useState(false);


    const addManualHistory = (startTime, endTime, duration) => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('th-TH');

        setSchedules(prev => [
                ...prev,
                {
                    time: startTime,
                    endTime: endTime,
                    duration,
                    date: dateStr,
                    source: 'manual', // เพื่อแยกจาก schedule
                },
            ]
        );
    };

    return (
        <div id="pump-management">
            <ManualControl addManualHistory={addManualHistory} />

            <ScheduleControl
                schedules={schedules}
                setSchedules={setSchedules}
                enableSchedule={enableSchedule}
                setEnableSchedule={setEnableSchedule}
            />

            <HistoryPanel
                show={showHistory}
                onClose={() => setShowHistory(false)}
                schedules={schedules}
            />
        </div>
    );
}

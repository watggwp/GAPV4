import React from 'react';

export default function ScheduleList({ schedules, onDelete }){
    return (
        <div className="schedule-list">
            <h3>รายการตั้งค่า</h3>
            {
                schedules.map((item, index) => (
                    <div key={index} className="schedule-item">
                        <span>เปิด {item.time} เป็นเวลา {item.duration} นาที</span>
                        <button onClick={() => onDelete(index)}>ลบ</button>
                    </div>
                ))
            }
        </div>
    );
}

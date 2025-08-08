import React, { useState, useRef, useCallback, useMemo } from 'react';
import ToggleSwitch from './ToggleSwitch';
import { Box } from '@mui/material';
import RequestAPI from '../../../js/requestAPI';
import { usePumpManagement } from '..';

export default function ManualControl({
    isOn,
    setIsOn
}) {
    const { device_id , role , setLogs , setupPumpStage } = usePumpManagement()

    const [ loadingToggle , setLoadingToggle ] = useState(false)

    const addManualHistory = useCallback((newLogs) => {
        setLogs(prev => [
                ...newLogs,
                ...prev,
            ]
        );
    } , [setLogs])

    const handleToggle = useCallback( async () => {
        let action = ""

        if (!isOn) {
            action = "on"
        } else {
            action = "off"
        }

        setLoadingToggle(true)
        setIsOn(prev => !prev)
        const { data , status } = await RequestAPI.post(`/api/pump/${device_id}/control` , {
            action : action
        } , {
            params : {
                r : role
            }
        })
        setLoadingToggle(false)

        switch(status) {
            case 200 :
                const { data : newLogs } = data
                addManualHistory(newLogs)
                break;    
            default :
                const { logs } = data 
                setupPumpStage(logs)
                break;
        }
    } , [addManualHistory, device_id, isOn, role, setIsOn, setupPumpStage])

    return (
        <Box className="section control-box" bgcolor={"secondary.main"}>
            <div className="state-label">
                <span className={`state-dot ${isOn ? 'on' : 'off'}`}></span>
                <span className="state-text">STATE {isOn ? 'ON' : 'OFF'}</span>
            </div>

            <h2>เปิด-ปิด ปั๊ม</h2>
            <ToggleSwitch isOn={isOn} onToggle={handleToggle} loadingToggle={loadingToggle}/>
        </Box>
    );
}

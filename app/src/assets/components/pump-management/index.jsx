import React, { createContext, useContext, useEffect, useState } from 'react';
import ManualControl from './components/ManualControl';
import ScheduleControl from './components/ScheduleControl';
import HistoryPanel from './components/HistoryPanel';
import "./indax.scss";
import { useCallback } from 'react';
import RequestAPI from '../../js/requestAPI';


const PumpManagementContext = createContext({
    device_id : "",
    role : "",
    logs : [],
    setLogs : () => {},
    setupPumpStage : () => {}
})

export default function PumpManagement({
    device_id,
    role,
    showHistory,
    setShowHistory
}) {
    const [logs, setLogs] = useState([])
    const [ pumpIsOn , setPumpIsOn ] = useState(false)

    const setupPumpStage = useCallback((newLogs) => {

        if(!newLogs.length) {
            setPumpIsOn(false)
            return
        }

        for(const index in newLogs) {
            const { action , source } = newLogs[index]

            if(source === "manual") {
                setPumpIsOn(action === "on")
                break
            }
        }
    } , [])

    const requestLogs = useCallback( async () => {
        const { data , status } = await RequestAPI.get(`/api/pump/${device_id}/log` , {
            r : role
        })

        switch(status) {
            case 200 :
                const { logs } = data
                setLogs(logs)
                setupPumpStage(logs)
                break;
            default :
                break;
        }
    } , [device_id, role, setupPumpStage])

    useEffect(() => {
        requestLogs()
    } , [requestLogs])

    return (
        <PumpManagementContext.Provider
            value={{
                device_id,
                role,
                logs,
                setLogs,
                setupPumpStage
            }}
        >
            <div id="pump-management">
                <ManualControl 
                    isOn={pumpIsOn} 
                    setIsOn={setPumpIsOn}
                />

                <ScheduleControl/>

                <HistoryPanel
                    show={showHistory}
                    onClose={() => setShowHistory(false)}
                />
            </div>
        </PumpManagementContext.Provider>
    );
}

export function usePumpManagement() {
    return useContext(PumpManagementContext)
}
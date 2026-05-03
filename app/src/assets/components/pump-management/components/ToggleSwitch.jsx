import React, { useMemo } from 'react';
import { DebounceTime, usePumpManagement } from '..';
import { useDebounce } from '../../useRoyalGAP';

export default function ToggleSwitch({ isOn, onToggle , loadingToggle }) {

    const { logs } = usePumpManagement()

    const timestamp = useMemo(() => {
        const { timestamp } = logs.find(({ source }) => source === "manual") || {}
        return timestamp || 0
    } , [logs])

    const debounce = useDebounce(timestamp , DebounceTime)

    return (
        <label className="switch">
            <input 
                type="checkbox" checked={isOn} onChange={onToggle} 
                disabled={debounce > 0 || loadingToggle}
            />
            {
                debounce > 0 ?
                    <span className='debounce'>
                        {debounce}s
                    </span> :
                    <span className="slider" />
            }
        </label>
    );
}
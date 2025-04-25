import React from 'react';

export default function ToggleSwitch({ isOn, onToggle }) {
    return (
        <label className="switch">
            <input type="checkbox" checked={isOn} onChange={onToggle} />
            <span className="slider" />
        </label>
    );
}
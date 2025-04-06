import React from "react";
import { Line } from "recharts";

export default function WeatherSensor() {
    return(
        <React.Fragment>
            <Line
                type="monotone"
                dataKey="temperature"
                stroke="#ff7300"
                name="อุณหภูมิ (°C)"
            />
            <Line
                type="monotone"
                dataKey="humidity"
                stroke="#387908"
                name="ความชื้น (%)"
            />
        </React.Fragment>
    )
}
import React from "react";
import { Line } from "recharts";

export default function HumidityChart() {
    return(
        <Line type="monotone" dataKey="humidity" stroke="yellow" activeDot={{ r: 8 }} />
    )
}
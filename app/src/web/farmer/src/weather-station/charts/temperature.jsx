import React, { useEffect } from "react";
import { Line } from "recharts";

export default function TemperatureChart() {
    return(
        <Line type="monotone" dataKey="temperature" stroke="green" activeDot={{ r: 8 }} />
    )
}
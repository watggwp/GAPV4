import React from "react";
import { Line } from "recharts";

export default function RainfallChart() {
    return(
        <Line type="monotone" dataKey="rainfall" stroke="blue" activeDot={{ r: 8 }} />
    )
}
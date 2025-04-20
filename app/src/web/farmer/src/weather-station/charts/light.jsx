import React from "react";
import { Line } from "recharts";

export default function LightChart() {
    return(
        <Line type="monotone" dataKey="light" stroke="orange" activeDot={{ r: 8 }} />
    )
}
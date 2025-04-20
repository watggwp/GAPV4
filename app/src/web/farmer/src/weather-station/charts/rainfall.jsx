import React from "react";
import { Line } from "recharts";

export default function RainfallChart() {
    return(
        <Line type="monotone" dataKey="rainfall" stroke="blue" name="น้ำฝน" dot={false} />
    )
}
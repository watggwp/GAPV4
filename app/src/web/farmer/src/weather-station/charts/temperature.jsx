import React, { useEffect } from "react";
import { Line } from "recharts";

export default function TemperatureChart() {

    useEffect(() => {
        console.log("TemperatureChart")
    } , [])

    return(
        <Line type="monotone" dataKey="temperature" stroke="#8884d8" activeDot={{ r: 8 }} />
    )
}
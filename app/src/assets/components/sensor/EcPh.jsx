import React from "react";
import { Line } from "recharts";

export default function EcPhSensor() {
    return(
        <React.Fragment>
            <Line
                type="monotone"
                dataKey="ec"
                stroke="#0088FE"
                name="EC (mS/cm)"
            />
            <Line
                type="monotone"
                dataKey="ph"
                stroke="#00C49F"
                name="pH"
            />
        </React.Fragment>
    )
}
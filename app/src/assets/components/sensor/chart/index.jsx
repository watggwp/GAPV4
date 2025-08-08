import { CartesianGrid, Legend, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ChartSensor({
    data,
    children
}) {
    return(
        <ResponsiveContainer width="100%" height={"100%"}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                {children}
            </LineChart>
        </ResponsiveContainer>
    )
}
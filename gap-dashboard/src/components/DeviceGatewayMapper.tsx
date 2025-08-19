import { Box, Button, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";

export default function DeviceGatewayMapper() {
    const [gateways, setGateways] = useState<string[]>([]);
    const [devices, setDevices] = useState<string[]>([]);
    const [selectedGateway, setSelectedGateway] = useState("");
    const [selectedDevice, setSelectedDevice] = useState("");

    // โหลด gateway / device ตอนเริ่มต้น
    useEffect(() => {
        const fetchData = async () => {
            try {
                const gwRes = await axios.get(`${import.meta.env.VITE_BACKEND}/api/gateways`);
                const devRes = await axios.get(`${import.meta.env.VITE_BACKEND}/api/devices`);

                const gateways = Array.isArray(gwRes.data) ? gwRes.data : [];
                const devices = Array.isArray(devRes.data) ? devRes.data : [];

                setGateways(gateways.map((g: any) => g.gateway_id));
                setDevices(devices.map((d: any) => d.device_id));
            } catch (err) {
                console.error("Failed to load gateway/device", err);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND}/api/groups/map-gateway-device`, {
                gateway_id: selectedGateway,
                device_id: selectedDevice
            });
            alert("✅ Mapping successful");
        } catch (err) {
            console.error(err);
            alert("❌ Mapping falied");
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="body1">Link a Gateway to a Device</Typography>

            <FormControl fullWidth>
                <InputLabel>Gateway</InputLabel>
                <Select
                    value={selectedGateway}
                    label="Gateway"
                    onChange={(e) => setSelectedGateway(e.target.value)}
                >
                    {gateways.map((gw) => (
                        <MenuItem key={gw} value={gw}>
                            {gw}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl fullWidth>
                <InputLabel>Device</InputLabel>
                <Select
                    value={selectedDevice}
                    label="Device"
                    onChange={(e) => setSelectedDevice(e.target.value)}
                >
                    {devices.map((dev) => (
                        <MenuItem key={dev} value={dev}>
                            {dev}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={!selectedGateway || !selectedDevice}
            >
                🔗 ผูก Gateway กับ Device
            </Button>
        </Box>
    );
}

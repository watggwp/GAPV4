import {
    Box, TextField, Button, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";
import { deviceTypes, type DeviceTypeKey } from "../../type/deviceTypes";

export default function AddDeviceForm() {
    const [deviceId, setDeviceId] = useState("");
    const [mqttTopic, setMqttTopic] = useState("");
    const [mqttUsername, setMqttUsername] = useState("");
    const [mqttPassword, setMqttPassword] = useState("");
    const [mqttBroker, setMqttBroker] = useState("as1.cloud.thethings.industries");
    const [mqttPort, setMqttPort] = useState("1883");
    const [groupId, setGroupId] = useState("");
    const [deviceType, setDeviceType] = useState<DeviceTypeKey | "">("");
    const [apiEndpoint, setApiEndpoint] = useState("");
    const [fields, setFields] = useState("");
    const [groupOptions, setGroupOptions] = useState<{ group_id: string; name: string }[]>([]);
    const [gatewayOptions, setGatewayOptions] = useState<{ gateway_id: string; name: string }[]>([]);
    const [selectedGatewayId, setSelectedGatewayId] = useState("");

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_BACKEND}/api/groups`)
            .then(res => setGroupOptions(res.data))
            .catch(err => console.error("Failed to load Group", err));

        axios.get(`${import.meta.env.VITE_BACKEND}/api/gateways`)
            .then(res => setGatewayOptions(res.data))
            .catch(err => console.error("Failed to load Gateways", err));
    }, []);

    const handleSubmit = async () => {
        // required เสมอ
        if (!deviceId || !mqttTopic || !mqttUsername || !mqttPassword) {
            alert("❗ Please fill in all required fields");
            return;
        }

        // ถ้ายังไม่เลือกประเภทก็บังคับให้เลือกก่อน
        if (!deviceType) {
            alert("❗ Please select device type");
            return;
        }

        // ถ้าไม่ใช่ pump ค่อยเช็ก apiEndpoint/fields
        if (deviceType !== "pump" && (!apiEndpoint || !fields.trim())) {
            alert("❗ Please fill API Endpoint and Fields");
            return;
        }

        const payload: any = {
            device_id: deviceId,
            mqtt_topic: mqttTopic,
            mqtt_username: mqttUsername,
            mqtt_password: mqttPassword,
            mqtt_broker: mqttBroker,
            mqtt_port: Number(mqttPort),
            group_id: groupId,
        };

        if (deviceType !== "pump") {
            payload.api_endpoint = apiEndpoint;
            payload.fields = fields.split(",").map(f => f.trim()).filter(Boolean);
        }

        try {
            // 1) create device
            await axios.post(`${import.meta.env.VITE_BACKEND}/api/devices`, payload);

            // 2) register to GAP (optional)
            if (deviceType) {
                await axios.post(`${import.meta.env.VITE_GAP_PORT}/api/add/device`, {
                    device_id: deviceId,
                    type: deviceType,
                });
            }

            // 3) link gateway (non-blocking)
            let linkError: unknown = null;
            if (selectedGatewayId) {
                try {
                    await axios.post(`${import.meta.env.VITE_BACKEND}/api/groups/map-gateway-device`, {
                        gateway_id: selectedGatewayId,
                        device_id: deviceId,
                    });
                } catch (e) {
                    linkError = e;
                    console.warn("Link gateway failed:", e);
                }
            }

            alert(linkError
                ? "✅ เพิ่ม Device สำเร็จ แต่ลิงก์กับ Gateway ไม่สำเร็จ"
                : "✅ Add device success"
            );

            // reset
            setDeviceId("");
            setMqttTopic("");
            setMqttUsername("");
            setMqttPassword("");
            setMqttBroker("as1.cloud.thethings.industries");
            setMqttPort("1883");
            setGroupId("");
            setDeviceType("");
            setApiEndpoint("");
            setFields("");
            setSelectedGatewayId("");

        } catch (err) {
            console.error(err);
            alert("❌ Failed to add Device");
        }
    };
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="Device ID" value={deviceId} onChange={e => setDeviceId(e.target.value)} />
            <TextField label="MQTT Topic" value={mqttTopic} onChange={e => setMqttTopic(e.target.value)} />
            <TextField label="MQTT Username" value={mqttUsername} onChange={e => setMqttUsername(e.target.value)} />
            <TextField label="MQTT Password" value={mqttPassword} onChange={e => setMqttPassword(e.target.value)} />
            <TextField label="MQTT Broker" value={mqttBroker} onChange={e => setMqttBroker(e.target.value)} />
            <TextField label="MQTT Port" value={mqttPort} onChange={e => setMqttPort(e.target.value)} />

            <FormControl fullWidth>
                <InputLabel>Select Group</InputLabel>
                <Select value={groupId} label="Select Group" onChange={e => setGroupId(e.target.value)}>
                    {groupOptions.map((g) => (
                        <MenuItem key={g.group_id} value={g.group_id}>{g.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl fullWidth>
                <InputLabel>Device Type</InputLabel>
                <Select
                    value={deviceType}
                    label="Device Type"
                    onChange={(e) => {
                        const type = e.target.value as DeviceTypeKey;
                        setDeviceType(type);
                        const cfg = deviceTypes[type];
                        setApiEndpoint(cfg?.api_endpoint ?? "");
                        setFields(Array.isArray(cfg?.fields) ? cfg.fields.join(",") : "");
                    }}
                >
                    {Object.entries(deviceTypes).map(([key, val]) => (
                        <MenuItem key={key} value={key}>{val.label}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField label="API Endpoint" value={apiEndpoint} onChange={e => setApiEndpoint(e.target.value)} disabled />
            <TextField label="Fields (comma separated)" value={fields} onChange={e => setFields(e.target.value)} disabled />

            <FormControl fullWidth>
                <InputLabel>Link to Gateway</InputLabel>
                <Select
                    value={selectedGatewayId}
                    label="Link to Gateway"
                    onChange={(e) => setSelectedGatewayId(e.target.value)}
                >
                    {gatewayOptions.map((g) => (
                        <MenuItem key={g.gateway_id} value={g.gateway_id}>
                            {g.name} ({g.gateway_id})
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Button variant="contained" color="success" onClick={handleSubmit}>
                Add Device
            </Button>
        </Box>
    );
}

// src/components/device/ManageDeviceList.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import {
    Box,
    Typography,
    IconButton,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { deviceTypes, type DeviceTypeKey } from "../../type/deviceTypes";

interface Device {
    device_id: string;
    name: string;
    device_info: {
        mqtt_topic: string;
        mqtt_username: string;
        mqtt_password: string;
        mqtt_broker: string;
        mqtt_port: number;
        api_endpoint?: string;
        fields: string[];
    };
    device: {
        group_id: string;
        name: string;
    };
}

interface Group {
    group_id: string;
    name: string;
}

export default function ManageDeviceList() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [groupOptions, setGroupOptions] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);
    const [editTarget, setEditTarget] = useState<Device | null>(null);

    // editable fields
    const [editName, setEditName] = useState("");
    const [editMqttTopic, setEditMqttTopic] = useState("");
    const [editMqttUsername, setEditMqttUsername] = useState("");
    const [editMqttPassword, setEditMqttPassword] = useState("");
    const [editMqttBroker, setEditMqttBroker] = useState("");
    const [editMqttPort, setEditMqttPort] = useState("1883");
    const [editGroupId, setEditGroupId] = useState("");

    useEffect(() => {
        fetchDevices();
        fetchGroups();
    }, []);

    const fetchDevices = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND}/api/devices`);
            setDevices(res.data);
        } catch (err) {
            console.error("❌ Failed to fetch devices:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND}/api/groups`);
            setGroupOptions(res.data);
        } catch (err) {
            console.error("❌ Failed to load groups:", err);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        // ตรวจสอบ type จาก api_endpoint เพื่อ map กลับเป็น type
        const matchedType = Object.entries(deviceTypes).find(
            ([, val]) => val.api_endpoint === deleteTarget.device_info?.api_endpoint
        )?.[0] as DeviceTypeKey | undefined;

        try {
            // ลบใน backend หลัก
            await axios.delete(`${import.meta.env.VITE_BACKEND}/api/devices/${deleteTarget.device_id}`);

            // ลบใน GAP service (ใช้ axios.delete แบบ config object)
            if (matchedType) {
                await axios.delete(`${import.meta.env.VITE_GAP_PORT}/api/delete/device`, {
                    data: {
                        device_id: deleteTarget.device_id,
                        type: matchedType
                    }
                });
            }

            // ลบจาก UI
            setDevices((prev) => prev.filter((d) => d.device_id !== deleteTarget.device_id));
        } catch (err) {
            console.error("❌ Failed to delete device:", err);
            alert("❌ Failed to delete device");
        } finally {
            setDeleteTarget(null);
        }
    };

    const handleEdit = (device: Device) => {
        setEditTarget(device);
        setEditName(device.name);
        setEditMqttTopic(device.device_info?.mqtt_topic || "");
        setEditMqttUsername(device.device_info?.mqtt_username || "");
        setEditMqttPassword(device.device_info?.mqtt_password || "");
        setEditMqttBroker(device.device_info?.mqtt_broker || "");
        setEditMqttPort(device.device_info?.mqtt_port?.toString() || "1883");
        setEditGroupId(device.device?.group_id || "");
    };

    const handleEditSave = async () => {
        if (!editTarget) return;

        // หา matchedType จาก api_endpoint ปัจจุบันของอุปกรณ์
        const matchedType = Object.entries(deviceTypes).find(
            ([, val]) => val.api_endpoint === editTarget.device_info?.api_endpoint
        )?.[0] as DeviceTypeKey | undefined;

        const selectedType = deviceTypes[matchedType || "pump"]; // fallback เป็น pump

        try {
            await axios.put(`${import.meta.env.VITE_BACKEND}/api/devices/${editTarget.device_id}`, {
                name: editName,
                mqtt_topic: editMqttTopic,
                mqtt_username: editMqttUsername,
                mqtt_password: editMqttPassword,
                mqtt_broker: editMqttBroker,
                mqtt_port: Number(editMqttPort),
                api_endpoint: selectedType.api_endpoint,
                fields: selectedType.fields,
                group_id: editGroupId || undefined,
            });

            alert("✅ Device updated!");
            setEditTarget(null);
            fetchDevices();
        } catch (err) {
            console.error("❌ Failed to update device:", err);
            alert("❌ Failed to update device");
        }
    };

    if (loading) {
        return (
            <Box textAlign="center" mt={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {devices.map((device) => (
                <Box
                    key={device.device_id}
                    sx={{
                        border: "1px solid #ddd",
                        borderRadius: 2,
                        p: 2,
                        mb: 2,
                        display: "flex",
                        justifyContent: "space-between",
                    }}
                >
                    <Box>
                        <Typography fontWeight={600}>{device.name}</Typography>
                        <Typography variant="caption" color="gray">
                            {device.device_id}
                        </Typography>
                    </Box>

                    <Box>
                        <IconButton onClick={() => handleEdit(device)}>
                            <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => setDeleteTarget(device)}>
                            <DeleteIcon />
                        </IconButton>
                    </Box>
                </Box>
            ))}

            {/* 🔴 Delete Confirmation Dialog */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete device "{deleteTarget?.name}"?
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
                    <Button color="error" onClick={handleDelete}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ✏️ Edit Device Modal */}
            <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Device: {editTarget?.device_id}</DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                    <TextField label="Name" value={editName} onChange={e => setEditName(e.target.value)} />
                    <TextField label="MQTT Topic" value={editMqttTopic} onChange={e => setEditMqttTopic(e.target.value)} />
                    <TextField label="MQTT Username" value={editMqttUsername} onChange={e => setEditMqttUsername(e.target.value)} />
                    <TextField label="MQTT Password" value={editMqttPassword} onChange={e => setEditMqttPassword(e.target.value)} />
                    <TextField label="MQTT Broker" value={editMqttBroker} onChange={e => setEditMqttBroker(e.target.value)} />
                    <TextField label="MQTT Port" value={editMqttPort} onChange={e => setEditMqttPort(e.target.value)} />

                    <FormControl fullWidth>
                        <InputLabel>Select Group</InputLabel>
                        <Select value={editGroupId} label="Select Group" onChange={e => setEditGroupId(e.target.value)}>
                            <MenuItem value="">(No Group)</MenuItem>
                            {groupOptions.map((g) => (
                                <MenuItem key={g.group_id} value={g.group_id}>{g.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditTarget(null)}>Cancel</Button>
                    <Button variant="contained" onClick={handleEditSave}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
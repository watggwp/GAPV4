// src/pages/GroupDetailPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import {
    Box, Typography, Grid, Card, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Select, MenuItem, InputLabel, FormControl,
    Snackbar, Alert
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { deviceTypes } from "../type/deviceTypes";
import Tooltip from "@mui/material/Tooltip";
interface Device {
    id: string;
    name: string;
    device_type?: string;
    mqtt_topic?: string;
    mqtt_username?: string;
    mqtt_password?: string;
    mqtt_broker?: string;
    mqtt_port?: number;
    api_endpoint?: string;
    group_id?: string;
}

interface Group {
    group_id: string;
    name: string;
}

interface Gateway {
    gateway_id: string;
    name: string;
    api_key?: string;
    tenant_domain?: string;
    region?: string;
    app_id?: string;
    group_id?: string;
    devices?: { id: string; name: string }[];
}

const getDeviceTypeFromEndpoint = (endpoint?: string): string | undefined => {
    if (!endpoint) return undefined;
    const entry = Object.entries(deviceTypes).find(
        ([_, value]) => value.api_endpoint === endpoint
    );
    return entry?.[0];
};
function shortText(str: string, front = 6, back = 6) {
    if (!str) return "";
    if (str.length <= front + back + 3) return str;
    return `${str.slice(0, front)}...${str.slice(-back)}`;
}

export default function GroupDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [groupName, setGroupName] = useState("");
    const [devices, setDevices] = useState<Device[]>([]);
    const [gateways, setGateways] = useState<Gateway[]>([]);
    const [allGroups, setAllGroups] = useState<Group[]>([]);

    // Device modal states
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [editedFields, setEditedFields] = useState<Partial<Device>>({});
    const deviceToDelete = devices.find(d => d.id === confirmDeleteId);

    // Gateway modal states
    const [editGatewayModalOpen, setEditGatewayModalOpen] = useState(false);
    const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null);
    const [editedGatewayFields, setEditedGatewayFields] = useState<Partial<Gateway>>({});
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkTargetDeviceId, setLinkTargetDeviceId] = useState<string | null>(null);
    const [linkSelectedGatewayId, setLinkSelectedGatewayId] = useState<string>("");
    const openLinkDialog = (deviceId: string) => {
        setLinkTargetDeviceId(deviceId);
        setLinkSelectedGatewayId("");
        setLinkDialogOpen(true);
    };
    const closeLinkDialog = () => {
        setLinkDialogOpen(false);
        setLinkTargetDeviceId(null);
        setLinkSelectedGatewayId("");
    };
    const confirmLink = async () => {
        if (!linkTargetDeviceId || !linkSelectedGatewayId) return;
        try {
            // ใช้ endpoint เดียวกับตอน AddDeviceForm
            await axios.post(`${import.meta.env.VITE_BACKEND}/api/groups/map-gateway-device`, {
                gateway_id: linkSelectedGatewayId,
                device_id: linkTargetDeviceId,
            });
            closeLinkDialog();
            await fetchGroupDetail();
            showSnackbar("✅ Linked device to gateway", "success");
        } catch (err) {
            console.error("❌ Failed to link device to gateway", err);
            showSnackbar("❌ Failed to link device to gateway", "error");
        }
    };
    // Snackbar
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

    // Fetch group detail (devices + gateways)
    const fetchGroupDetail = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND}/api/groups/${id}`);
            setGroupName(res.data.name);
            setDevices(res.data.devices);
            // map id -> gateway_id
            setGateways(
                (res.data.gateways || []).map((gw: any) => ({
                    ...gw,
                    gateway_id: gw.gateway_id || gw.id  // ถ้า gw.gateway_id ไม่มี ให้ใช้ gw.id
                }))
            );
        } catch (err) {
            console.error("Error fetching group detail", err);
        }
    };

    // Fetch all groups (for dropdown)
    const fetchGroups = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND}/api/groups`);
            setAllGroups(res.data);
        } catch (err) {
            console.error("Error fetching all groups", err);
        }
    };

    useEffect(() => {
        fetchGroupDetail();
        fetchGroups();
    }, [id]);

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbar({ open: true, message, severity });
    };

    // -------- Device modal actions --------
    const handleEditClick = (device: Device) => {
        setSelectedDevice(device);
        setEditedFields({ ...device });
        setEditModalOpen(true);
    };

    const handleFieldChange = (field: keyof Device, value: any) => {
        setEditedFields(prev => ({ ...prev, [field]: value }));
    };

    const handleDelete = async (deviceId: string) => {
        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND}/api/devices/${deviceId}`);

            // หา type จาก api_endpoint
            const type = getDeviceTypeFromEndpoint(deviceToDelete?.api_endpoint);
            if (type) {
                await axios.delete(`${import.meta.env.VITE_GAP_PORT}/api/delete/device`, {
                    data: {
                        device_id: deviceId,
                        type
                    }
                });
            }

            showSnackbar("✅ Device deleted", "success");
            fetchGroupDetail();
        } catch (err) {
            console.error("❌ Failed to delete device", err);
            showSnackbar("❌ Failed to delete device", "error");
        }
    };

    // -------- Gateway modal actions --------
    const handleGatewayEditClick = (gateway: Gateway) => {
        setSelectedGateway(gateway);
        setEditedGatewayFields({ ...gateway });
        setEditGatewayModalOpen(true);
    };

    const handleGatewayFieldChange = (field: keyof Gateway, value: any) => {
        setEditedGatewayFields(prev => ({ ...prev, [field]: value }));
    };
    const handleDeleteGateway = async (gatewayId: string) => {
        try {
            // 1. ลบที่ backend หลัก
            await axios.delete(`${import.meta.env.VITE_BACKEND}/api/gateways/${gatewayId}`);

            showSnackbar("✅ Gateway deleted", "success");
            fetchGroupDetail();
        } catch (err) {
            console.error("❌ Failed to delete gateway", err);
            showSnackbar("❌ Failed to delete gateway", "error");
        }
    };
    return (
        <Box sx={{ bgcolor: "#fefef8", minHeight: "100vh", width: "100vw", }}>

            <Box sx={{ position: "relative", width: "100%", py: "40px" }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    variant="contained"
                    color="success"
                    sx={{
                        position: "absolute",
                        left: 24,  // px ตาม px:3 (หรือเปลี่ยนตาม px จริง)
                        top: "50%",
                        transform: "translateY(-50%)",
                        boxShadow: 2,
                        borderRadius: 999,
                        fontWeight: "bold",
                        px: 3,
                        py: 1,
                        background: "#E3F6E5",
                        color: "#507D2A",
                        '&:hover': {
                            background: "#B4D6B2",
                            color: "#507D2A"
                        }
                    }}
                    onClick={() => navigate(-1)}
                >
                    Back
                </Button>

                <Typography
                    variant="h4"
                    fontWeight="bold"
                    color="#507D2A"
                    sx={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        textAlign: "center",
                        width: "max-content"
                    }}
                >
                    🏡 {groupName}
                </Typography>
            </Box>
            <Typography variant="h6" textAlign="center" mb={3} color="#507D2A">
                Manage Device
            </Typography>
            <Grid container spacing={3} justifyContent="center">
                {devices.map((device) => (
                    <Grid key={device.id} size={{ xs: 12, sm: 6, md: 4 }} >
                        <Card
                            variant="outlined"
                            sx={{
                                p: 2,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                borderRadius: 2
                            }}
                        >
                            <Typography>{device.name}</Typography>
                            <Box>
                                <IconButton onClick={() => handleEditClick(device)}><EditIcon /></IconButton>
                                <IconButton onClick={() => setConfirmDeleteId(device.id)}>
                                    <DeleteIcon color="error" />
                                </IconButton>
                                {gateways.length > 0 && (
                                    <Button
                                        size="small"
                                        sx={{ ml: 1 }}
                                        variant="outlined"
                                        onClick={() => openLinkDialog(device.id)}
                                    >
                                        Link
                                    </Button>
                                )}
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* ---------- Gateway Section ---------- */}
            <Typography variant="h6" textAlign="center" mb={3} mt={5} color="#507D2A">
                Manage Gateway
            </Typography>
            <Grid container spacing={3} justifyContent="center">
                {gateways.map((gw) => (
                    <Grid key={gw.gateway_id} size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card
                            variant="outlined"
                            sx={{
                                p: 2,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                borderRadius: 2
                            }}
                        >
                            <Box>
                                <Typography fontWeight="bold">{gw.name}</Typography>
                                <Tooltip title={gw.api_key || ""} arrow>
                                    <Typography
                                        fontSize={14}
                                        color="text.secondary"
                                        sx={{
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            maxWidth: 350, // ปรับขนาดได้
                                            cursor: gw.api_key ? "pointer" : "default"
                                        }}
                                    >
                                        API Key: {shortText(gw.api_key || "")}
                                    </Typography>
                                </Tooltip>
                                <Tooltip title={gw.tenant_domain || ""} arrow>
                                    <Typography
                                        fontSize={13}
                                        color="text.secondary"
                                        sx={{
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            maxWidth: 350,
                                            cursor: gw.tenant_domain ? "pointer" : "default"
                                        }}
                                    >
                                        Domain: {shortText(gw.tenant_domain || "", 15, 13)}
                                    </Typography>
                                </Tooltip>
                                {gw.devices && gw.devices.length > 0 && (
                                    <Box sx={{ mt: 1 }}>
                                        <Typography fontWeight="bold" fontSize={13}>Linked Devices:</Typography>
                                        {gw.devices.map(device => (
                                            <Box key={device.id} sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                                                <Typography fontSize={13}>{device.name}</Typography>
                                                <IconButton
                                                    size="small"
                                                    onClick={async () => {
                                                        try {
                                                            await axios.delete(`${import.meta.env.VITE_BACKEND}/api/gateways/${gw.gateway_id}/devices/${device.id}`);
                                                            fetchGroupDetail();
                                                            showSnackbar("✅ Device unlinked", "success");
                                                        } catch (err) {
                                                            showSnackbar("❌ Failed to unlink device", "error");
                                                        }
                                                    }}
                                                    sx={{ ml: 0.5 }}
                                                >
                                                    <DeleteIcon color="error" fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                            <Box>
                                <IconButton onClick={() => handleGatewayEditClick(gw)}>
                                    <EditIcon />
                                </IconButton>
                                <IconButton onClick={() => setConfirmDeleteId(gw.gateway_id)}>
                                    <DeleteIcon color="error" />
                                </IconButton>
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            {/* ----------- Edit Device Modal ----------- */}
            <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Device</DialogTitle>
                <DialogContent>
                    <TextField label="Device Name" fullWidth value={editedFields.name || ""} onChange={(e) => handleFieldChange("name", e.target.value)} sx={{ mt: 2 }} />
                    <TextField label="MQTT Topic" fullWidth value={editedFields.mqtt_topic || ""} onChange={(e) => handleFieldChange("mqtt_topic", e.target.value)} sx={{ mt: 2 }} />
                    <TextField label="MQTT Username" fullWidth value={editedFields.mqtt_username || ""} onChange={(e) => handleFieldChange("mqtt_username", e.target.value)} sx={{ mt: 2 }} />
                    <TextField label="MQTT Password" fullWidth value={editedFields.mqtt_password || ""} onChange={(e) => handleFieldChange("mqtt_password", e.target.value)} sx={{ mt: 2 }} />
                    <TextField label="MQTT Broker" fullWidth value={editedFields.mqtt_broker || ""} onChange={(e) => handleFieldChange("mqtt_broker", e.target.value)} sx={{ mt: 2 }} />
                    <TextField label="MQTT Port" type="number" fullWidth value={editedFields.mqtt_port || ""} onChange={(e) => handleFieldChange("mqtt_port", parseInt(e.target.value))} sx={{ mt: 2 }} />
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Group</InputLabel>
                        <Select value={editedFields.group_id || ""} label="Group" onChange={(e) => handleFieldChange("group_id", e.target.value)}>
                            {allGroups.map((group) => (
                                <MenuItem key={group.group_id} value={group.group_id}>{group.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={() => setConfirmSaveOpen(true)}>Save</Button>
                </DialogActions>
            </Dialog>

            {/* ----------- Confirm Save Device ----------- */}
            <Dialog open={confirmSaveOpen} onClose={() => setConfirmSaveOpen(false)}>
                <DialogTitle>Confirm Edit</DialogTitle>
                <DialogContent>Are you sure you want to save the changes?</DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmSaveOpen(false)}>Cancel</Button>
                    <Button
                        onClick={async () => {
                            setConfirmSaveOpen(false);
                            if (!selectedDevice) return;
                            try {
                                await axios.put(`${import.meta.env.VITE_BACKEND}/api/devices/${selectedDevice.id}`, editedFields);
                                setEditModalOpen(false);
                                setSelectedDevice(null);
                                fetchGroupDetail();
                                showSnackbar("✅ Device updated successfully", "success");
                            } catch (err) {
                                console.error("❌ Failed to update device", err);
                                showSnackbar("❌ Failed to update device", "error");
                            }
                        }}
                        variant="contained"
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ----------- Confirm Delete Device ----------- */}
            <Dialog open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    {devices.some(d => d.id === confirmDeleteId)
                        ? <>Are you sure you want to delete device <strong>{deviceToDelete?.name || confirmDeleteId}</strong>?</>
                        : <>Are you sure you want to delete gateway <strong>{gateways.find(gw => gw.gateway_id === confirmDeleteId)?.name || confirmDeleteId}</strong>?</>
                    }
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                    <Button
                        onClick={() => {
                            if (!confirmDeleteId) return;
                            if (devices.some(d => d.id === confirmDeleteId)) {
                                handleDelete(confirmDeleteId);
                            } else if (gateways.some(gw => gw.gateway_id === confirmDeleteId)) {
                                handleDeleteGateway(confirmDeleteId); // <== เรียกของ gateway
                            }
                            setConfirmDeleteId(null);
                        }}
                        variant="contained"
                        color="error"
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ----------- Edit Gateway Modal ----------- */}
            <Dialog open={editGatewayModalOpen} onClose={() => setEditGatewayModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Gateway</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Gateway Name"
                        fullWidth
                        value={editedGatewayFields.name || ""}
                        onChange={e => handleGatewayFieldChange("name", e.target.value)}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        label="API Key"
                        fullWidth
                        value={editedGatewayFields.api_key || ""}
                        onChange={e => handleGatewayFieldChange("api_key", e.target.value)}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        label="Tenant Domain"
                        fullWidth
                        value={editedGatewayFields.tenant_domain || ""}
                        onChange={e => handleGatewayFieldChange("tenant_domain", e.target.value)}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        label="Region"
                        fullWidth
                        value={editedGatewayFields.region || ""}
                        onChange={e => handleGatewayFieldChange("region", e.target.value)}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        label="App ID"
                        fullWidth
                        value={editedGatewayFields.app_id || ""}
                        onChange={e => handleGatewayFieldChange("app_id", e.target.value)}
                        sx={{ mt: 2 }}
                    />
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Group</InputLabel>
                        <Select
                            value={editedGatewayFields.group_id || ""}
                            label="Group"
                            onChange={(e) => handleGatewayFieldChange("group_id", e.target.value)}
                        >
                            {allGroups.map((group) => (
                                <MenuItem key={group.group_id} value={group.group_id}>{group.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditGatewayModalOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={async () => {
                            if (!selectedGateway) return;
                            try {
                                await axios.put(`${import.meta.env.VITE_BACKEND}/api/gateways/${selectedGateway.gateway_id}`, editedGatewayFields);
                                setEditGatewayModalOpen(false);
                                setSelectedGateway(null);
                                fetchGroupDetail();
                                showSnackbar("✅ Gateway updated successfully", "success");
                            } catch (err) {
                                console.error("❌ Failed to update gateway", err);
                                showSnackbar("❌ Failed to update gateway", "error");
                            }
                        }}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={linkDialogOpen} onClose={closeLinkDialog} maxWidth="xs" fullWidth>
                <DialogTitle>Link device to gateway</DialogTitle>
                <DialogContent>
                    {gateways.length === 0 ? (
                        <Typography color="text.secondary" sx={{ mt: 1 }}>
                            ยังไม่มีกล่อง Gateway ให้เชื่อม กรุณาเพิ่ม Gateway ก่อน
                        </Typography>
                    ) : (
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Gateway</InputLabel>
                            <Select
                                label="Gateway"
                                value={linkSelectedGatewayId}
                                onChange={(e) => setLinkSelectedGatewayId(e.target.value)}
                            >
                                {gateways.map((g) => (
                                    <MenuItem key={g.gateway_id} value={g.gateway_id}>
                                        {g.name} ({shortText(g.gateway_id, 6, 6)})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeLinkDialog}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={confirmLink}
                        disabled={!linkSelectedGatewayId || gateways.length === 0}
                    >
                        Link
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ----------- Snackbar ----------- */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box >
    );
}

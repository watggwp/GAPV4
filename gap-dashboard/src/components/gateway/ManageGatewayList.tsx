// src/components/gateway/ManageGatewayList.tsx
// src/components/gateway/ManageGatewayList.tsx
import {
    Box, Typography, IconButton, CircularProgress, Dialog, DialogTitle,
    DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import { useEffect, useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";

interface Gateway {
    gateway_id: string;
    name?: string;
    group?: {
        group_id: string;
        name: string;
    };
    gateway_info?: {
        api_key: string;
        tenant_domain: string;
        region: string;
        app_id: string;
    };
    devices?: {
        device: {
            device_id: string;
            name?: string;
        };
    }[];
}
interface Group {
    group_id: string;
    name: string;
}

export default function ManageGatewayList() {
    const [gateways, setGateways] = useState<Gateway[]>([]);
    const [groupOptions, setGroupOptions] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<Gateway | null>(null);
    const [editTarget, setEditTarget] = useState<Gateway | null>(null);

    // Editable fields
    const [editApiKey, setEditApiKey] = useState("");
    const [editTenantDomain, setEditTenantDomain] = useState("");
    const [editGroupId, setEditGroupId] = useState("");

    useEffect(() => {
        fetchGateways();
        fetchGroups();
    }, []);

    const fetchGateways = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND}/api/gateways`);
            setGateways(res.data);
        } catch (err) {
            console.error("❌ Failed to fetch gateways", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND}/api/groups`);
            setGroupOptions(res.data);
        } catch (err) {
            console.error("❌ Failed to load groups", err);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND}/api/gateways/${deleteTarget.gateway_id}`);
            setGateways(prev => prev.filter(g => g.gateway_id !== deleteTarget.gateway_id));
        } catch (err) {
            console.error("❌ Failed to delete gateway", err);
        } finally {
            setDeleteTarget(null);
        }
    };

    const handleEdit = (gateway: Gateway) => {
        setEditTarget(gateway);

        setEditApiKey(gateway.gateway_info?.api_key || "");
        setEditTenantDomain(gateway.gateway_info?.tenant_domain || "");
        setEditGroupId(gateway.group?.group_id || "");
    };

    const handleEditSave = async () => {
        if (!editTarget) return;
        try {
            await axios.put(`${import.meta.env.VITE_BACKEND}/api/gateways/${editTarget.gateway_id}`, {
                api_key: editApiKey,
                tenant_domain: editTenantDomain,
                group_id: editGroupId || undefined,
            });
            alert("✅ Gateway updated!");
            setEditTarget(null);
            fetchGateways();
        } catch (err) {
            console.error("❌ Failed to update gateway", err);
            alert("❌ Failed to update gateway");
        }
    };
    const handleUnlink = async (gateway_id: string, device_id: string) => {
        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND}/api/gateways/${gateway_id}/devices/${device_id}`);
            fetchGateways(); // โหลดใหม่
        } catch (err) {
            console.error("❌ Failed to unlink device", err);
            alert("❌ Failed to unlink device");
        }
    };
    if (loading) {
        return <Box textAlign="center" mt={4}><CircularProgress /></Box>;
    }

    return (
        <Box>
            {gateways.map(g => (
                <Box key={g.gateway_id} sx={{ border: "1px solid #ccc", p: 2, mb: 2, display: "flex", justifyContent: "space-between" }}>
                    <Box>
                        <Typography fontWeight={600}>{g.gateway_id}</Typography>
                        <Typography variant="caption" color="gray">
                            Tenant: {g.gateway_info?.tenant_domain}
                        </Typography>

                        {Array.isArray(g.devices) && g.devices.length > 0 && (
                            <Box mt={1}>
                                <Typography variant="body2">Linked Devices:</Typography>
                                {g.devices.map(({ device }) => (
                                    <Box key={device.device_id} display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="caption">{device.name || device.device_id}</Typography>
                                        <Button
                                            size="small"
                                            color="error"
                                            onClick={() => handleUnlink(g.gateway_id, device.device_id)}
                                        >
                                            Unlink
                                        </Button>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                    <Box>
                        <IconButton onClick={() => handleEdit(g)}><EditIcon /></IconButton>
                        <IconButton color="error" onClick={() => setDeleteTarget(g)}><DeleteIcon /></IconButton>
                    </Box>
                </Box>
            ))}

            {/* Delete dialog */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete gateway "{deleteTarget?.gateway_id}"?
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
                    <Button color="error" onClick={handleDelete}>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Edit modal */}
            <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Gateway: {editTarget?.gateway_id}</DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                    <TextField
                        label="API Key"
                        value={editApiKey}
                        onChange={(e) => setEditApiKey(e.target.value)}
                    />
                    <TextField
                        label="Tenant Domain"
                        value={editTenantDomain}
                        onChange={(e) => setEditTenantDomain(e.target.value)}
                    />
                    <FormControl fullWidth>
                        <InputLabel>Select Group</InputLabel>
                        <Select
                            value={editGroupId}
                            onChange={(e) => setEditGroupId(e.target.value)}
                        >
                            <MenuItem value="">(No Group)</MenuItem>
                            {groupOptions.map((g) => (
                                <MenuItem key={g.group_id} value={g.group_id}>
                                    {g.name}
                                </MenuItem>
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

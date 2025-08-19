// src/components/gateway/AddGatewayForm.tsx
// src/components/gateway/AddGatewayForm.tsx
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";

export default function AddGatewayForm({ onSuccess }: { onSuccess?: () => void }) {
    const [gatewayId, setGatewayId] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [tenantDomain, setTenantDomain] = useState("");
    const [groupId, setGroupId] = useState("");
    const [groupOptions, setGroupOptions] = useState<{ group_id: string; name: string }[]>([]);

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_BACKEND}/api/groups`)
            .then(res => setGroupOptions(res.data))
            .catch(err => console.error("Failed to load Group", err));
    }, []);

    const handleSubmit = async () => {
        if (!gatewayId || !apiKey || !tenantDomain || !groupId) {
            alert("❗ Please fill in all fields");
            return;
        }

        try {
            await axios.post(`${import.meta.env.VITE_BACKEND}/api/gateways`, {
                gateway_id: gatewayId,
                api_key: apiKey,
                tenant_domain: tenantDomain,
                region: "as1",
                app_id: "my-app-id",
                group_id: groupId,
            });

            alert("✅ Add gateway success");

            // Reset form
            setGatewayId("");
            setApiKey("");
            setTenantDomain("");
            setGroupId("");

            // Optional callback to parent
            onSuccess?.();

        } catch (err) {
            console.error(err);
            alert("❌ Failed to Add gateway");
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
                label="Gateway ID"
                value={gatewayId}
                onChange={e => setGatewayId(e.target.value)}
                required
            />
            <TextField
                label="API Key"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                required
            />
            <TextField
                label="Tenant Domain"
                value={tenantDomain}
                onChange={e => setTenantDomain(e.target.value)}
                required
            />

            <FormControl fullWidth required>
                <InputLabel>Select Group</InputLabel>
                <Select
                    value={groupId}
                    label="Select Group"
                    onChange={e => setGroupId(e.target.value)}
                >
                    {groupOptions.map((g) => (
                        <MenuItem key={g.group_id} value={g.group_id}>
                            {g.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Button variant="contained" color="success" onClick={handleSubmit}>
                Add Gateway
            </Button>
        </Box>
    );
}

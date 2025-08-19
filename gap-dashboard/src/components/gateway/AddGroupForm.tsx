// src/components/gateway/AddGroupForm.tsx
import { Box, TextField, Button } from "@mui/material";
import { useState } from "react";
import axios from "axios";

interface AddGroupFormProps {
    onSuccess?: () => void; // ✅ Callback เมื่อเพิ่มสำเร็จ
}

export default function AddGroupForm({ onSuccess }: AddGroupFormProps) {
    const [groupId, setGroupId] = useState("");
    const [groupName, setGroupName] = useState("");

    const handleSubmit = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND}/api/groups`, {
                group_id: groupId,
                name: groupName
            });
            alert("✅ Add group success");
            setGroupId("");
            setGroupName("");
            if (onSuccess) onSuccess(); // 🔁 เรียก callback
        } catch (err) {
            console.error(err);
            alert("❌ Failed to add group");
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField label="Group ID (เช่น nk, kn)" value={groupId} onChange={e => setGroupId(e.target.value)} />
            <TextField label="Group Name (เช่น ศูนย์หนองเขียว)" value={groupName} onChange={e => setGroupName(e.target.value)} />
            <Button variant="contained" color="success" onClick={handleSubmit}>
                Add Group
            </Button>
        </Box>
    );
}
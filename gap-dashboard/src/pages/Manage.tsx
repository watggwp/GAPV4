// src/pages/Manage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    Button,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddDeviceForm from "../components/device/AddDeviceForm";
import AddGroupForm from "../components/gateway/AddGroupForm";
import AddGatewayForm from "../components/gateway/AddGatewayForm";
import GroupCard from "../components/group/GroupCard";
import axios from "axios";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../context/AuthContext";
interface GroupData {
    group_id: string;
    name: string;
    devices: { device_id: string; name?: string }[];
    gateways: { gateway_id: string; name?: string }[];
}


export default function ManagePage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [groups, setGroups] = useState<GroupData[]>([]);
    const [openDeviceModal, setOpenDeviceModal] = useState(false);
    const [openGroupModal, setOpenGroupModal] = useState(false);
    const [openGatewayModal, setOpenGatewayModal] = useState(false); // ✅ NEW

    useEffect(() => {
        if (!user) {
            navigate("/login");
        } else {
            fetchGroups();
        }
    }, [user]);

    const fetchGroups = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND}/api/groups`);
            setGroups(res.data);
        } catch (error) {
            console.error("Error fetching groups", error);
        }
    };
    const handleDeleteGroup = async (groupId: string) => {
        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND}/api/groups/${groupId}`);
            fetchGroups();
        } catch (err) {
            alert("ลบกลุ่มไม่สำเร็จ");
        }
    };
    if (!user) return null;

    return (
        <Box sx={{ bgcolor: "#fefef8", minHeight: "100vh", width: "100vw", justifyContent: "center" }}>
            <Box sx={{ position: "relative", width: "100%", py: "50px" }}>
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
                    onClick={() => navigate("/")}
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
                        width: "max-content",
                        mb: "20px"
                    }}
                >
                    🛠 Manage Device and Gateway
                </Typography>
            </Box>
            <Grid container spacing={4} justifyContent="center">
                <Grid size={{ xs: 12, md: 8 }} px={3}>
                    <Grid container spacing={3}>
                        {groups.map((group) => (
                            <Grid key={group.group_id} size={{ xs: 12, sm: 6, md: 3 }}>
                                <GroupCard
                                    id={group.group_id}
                                    name={group.name}
                                    devices={group.devices}
                                    gateways={group.gateways || []}
                                    onDeleteGroup={handleDeleteGroup}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Grid>

                <Grid size={{ md: 2 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, justifyItems: "center" }}>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={() => setOpenDeviceModal(true)}
                            sx={{ borderRadius: "20px" }}
                        >
                            Add New Device
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={() => setOpenGatewayModal(true)}
                            sx={{ borderRadius: "20px" }}
                        >
                            Add New Gateway
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={() => setOpenGroupModal(true)}
                            sx={{ borderRadius: "20px" }}
                        >
                            Add New Group
                        </Button>
                    </Box>
                </Grid>
            </Grid>

            {/* ✅ Modal: Add Device */}
            <Dialog open={openDeviceModal} onClose={() => setOpenDeviceModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Add New Device
                    <IconButton
                        onClick={() => setOpenDeviceModal(false)}
                        sx={{ position: "absolute", right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <AddDeviceForm />
                </DialogContent>
            </Dialog>

            {/* ✅ Modal: Add Group */}
            <Dialog open={openGroupModal} onClose={() => setOpenGroupModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Add New Group
                    <IconButton
                        onClick={() => setOpenGroupModal(false)}
                        sx={{ position: "absolute", right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <AddGroupForm onSuccess={() => {
                        setOpenGroupModal(false);
                        fetchGroups(); // รีโหลด Group หลังเพิ่ม
                    }} />
                </DialogContent>
            </Dialog>

            {/* ✅ Modal: Add Gateway */}
            <Dialog open={openGatewayModal} onClose={() => setOpenGatewayModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Add New Gateway
                    <IconButton
                        onClick={() => setOpenGatewayModal(false)}
                        sx={{ position: "absolute", right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <AddGatewayForm onSuccess={() => {
                        setOpenGatewayModal(false);
                        fetchGroups(); // รีโหลดกลุ่มด้วย เผื่อ Gateway เชื่อม Group
                    }} />
                </DialogContent>
            </Dialog>
        </Box>
    );
}
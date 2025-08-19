// src/components/gateway/ManageGroupList.tsx
import { Box, Typography, IconButton, Dialog, DialogTitle, DialogActions, Button } from "@mui/material";
import farm from '../../assets/icon/farm.svg';
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface GroupCardProps {
    id: string;
    name: string;
    devices: { device_id: string; name?: string }[];
    gateways: { gateway_id: string; name?: string }[];
    onDeleteGroup?: (id: string) => void;
}

export default function GroupCard({ id, name, devices, gateways, onDeleteGroup }: GroupCardProps) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    return (
        <Box
            onClick={() => navigate(`/groups/${id}`)}
            sx={{
                border: "1.5px solid #D0C19A",
                borderRadius: "12px",
                p: 2,
                textAlign: "center",
                bgcolor: "#fff",
                cursor: "pointer",
                transition: "0.2s",
                "&:hover": { boxShadow: 3 },
                maxWidth: 270,
                margin: "auto",
                position: "relative",
            }}
        >
            <Box sx={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between", mb: 1
            }}>
                <Box sx={{
                    backgroundColor: "#D0C19A",
                    borderRadius: "16px",
                    px: 2,
                    py: "2px",
                    fontWeight: "bold",
                    color: "#507D2A",
                    fontSize: "14px",
                    display: "inline-block",
                }}>
                    {devices.length} Devices / {gateways.length} Gateways
                </Box>
                {onDeleteGroup && (
                    <>
                        <IconButton
                            size="small"
                            onClick={e => { e.stopPropagation(); setOpen(true); }}
                            sx={{
                                color: "error.main", ml: 1,
                                border: "1px solid #faecec", bgcolor: "#fff",
                                ":hover": { bgcolor: "#ffeaea" }
                            }}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                        <Dialog open={open} onClose={() => setOpen(false)}>
                            <DialogTitle>
                                ลบกลุ่ม "{name}" ?<br />
                                <span style={{ fontWeight: 400, fontSize: 14 }}>ข้อมูลทั้งหมดในกลุ่มนี้จะหายไปถาวร!</span>
                            </DialogTitle>
                            <DialogActions>
                                <Button onClick={() => setOpen(false)}>Cancel</Button>
                                <Button
                                    color="error"
                                    variant="contained"
                                    onClick={() => { setOpen(false); onDeleteGroup(id); }}
                                >Delete</Button>
                            </DialogActions>
                        </Dialog>
                    </>
                )}
            </Box>
            <Box sx={{ my: 1 }}>
                <img src={farm} alt="farm" width={56} height={56} />
            </Box>
            <Typography sx={{ color: "#507D2A", fontWeight: 600, fontSize: "15px", mb: 1 }}>
                {name}
            </Typography>
            <Typography fontSize={13} fontWeight={500} sx={{ mt: 1 }}>Devices:</Typography>
            {devices.length > 0 ? (
                devices.map(d => (
                    <Typography key={d.device_id} fontSize={13}>
                        {d.name || d.device_id}
                    </Typography>
                ))
            ) : (
                <Typography fontSize={13} color="gray">-</Typography>
            )}
            <Typography fontSize={13} fontWeight={500} sx={{ mt: 1 }}>Gateways:</Typography>
            {gateways.length > 0 ? (
                gateways.map(g => (
                    <Typography key={g.gateway_id} fontSize={13}>
                        {g.name || g.gateway_id}
                    </Typography>
                ))
            ) : (
                <Typography fontSize={13} color="gray">-</Typography>
            )}
        </Box>
    );
}
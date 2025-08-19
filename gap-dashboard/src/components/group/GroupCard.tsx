// src/components/group/GroupCard.tsx
import { Box, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import farm from '../../assets/icon/farm.svg';
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
    const [openConfirm, setOpenConfirm] = useState(false);

    return (
        <Box
            sx={{
                border: "1.5px solid #D0C19A",
                borderRadius: "20px",
                p: 2,
                textAlign: "center",
                backgroundColor: "#fff",
                cursor: "pointer",
                transition: "0.2s",
                "&:hover": { boxShadow: 4 },
                position: "relative",
                maxWidth: "200px",
                margin: "auto",
                minHeight: "100px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between"
            }}
            onClick={e => {
                if ((e.target as HTMLElement).closest('.delete-btn')) return;
                navigate(`/groups/${id}`);
            }}
        >

            {/* แถวแสดง tag Device และ Gateway */}
            <Box sx={{
                display: "flex",
                gap: 1.2,
                justifyContent: "center",
                alignItems: "center",
                mt: 1.5,
                mb: 0.5,
                width: "100%",
                flexDirection: "column"
            }}>
                <Box sx={{
                    backgroundColor: "#D0C19A",
                    borderRadius: "16px",
                    px: 2,
                    py: 0.5,
                    fontWeight: "bold",
                    color: "#507D2A",
                    fontSize: "15px",
                    minWidth: 80,
                }}>
                    {devices.length} Device
                </Box>
                <Box sx={{
                    backgroundColor: "#D0C19A",
                    borderRadius: "16px",
                    px: 2,
                    py: 0.5,
                    fontWeight: "bold",
                    color: "#507D2A",
                    fontSize: "15px",
                    minWidth: 80,
                }}>
                    {gateways.length} Gateway
                </Box>
            </Box>

            {/* ไอคอนฟาร์ม */}
            <Box sx={{ my: 2 }}>
                <img src={farm} alt="farm" width={70} height={70} />
            </Box>

            {/* ชื่อกลุ่ม */}
            <Typography sx={{
                color: "#234",
                fontWeight: 600,
                fontSize: "17px",
                mb: 1,
                wordBreak: "break-word"
            }}>
                {name}
            </Typography>

            {/* ปุ่มลบอยู่ด้านล่าง กึ่งกลาง */}
            {onDeleteGroup && (
                <>
                    <Box sx={{ mt: "auto", mb: 0.5, width: "100%", display: "flex", justifyContent: "center" }}>
                        <IconButton
                            size="medium"
                            className="delete-btn"
                            onClick={e => {
                                e.stopPropagation();
                                setOpenConfirm(true);
                            }}
                            sx={{
                                background: "#fff",
                                boxShadow: 1,
                                "&:hover": { background: "#ffebee", color: "#b71c1c" },
                                borderRadius: "50%",
                            }}
                            aria-label="delete group"
                        >
                            <DeleteIcon fontSize="medium" />
                        </IconButton>
                    </Box>
                    <Dialog
                        open={openConfirm}
                        onClose={() => setOpenConfirm(false)}
                        maxWidth="xs"
                    >
                        <DialogTitle sx={{ fontWeight: 600, color: "#b71c1c" }}>
                            ยืนยันการลบกลุ่มนี้?
                        </DialogTitle>
                        <DialogContent>
                            <Typography>
                                ต้องการลบ <strong>{name}</strong> หรือไม่?<br />
                                <span style={{ color: "#b71c1c", fontWeight: 500 }}>
                                    ** ข้อมูลที่เกี่ยวข้องในกลุ่มนี้จะหายไปด้วย
                                </span>
                            </Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpenConfirm(false)}>ยกเลิก</Button>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={() => {
                                    setOpenConfirm(false);
                                    onDeleteGroup && onDeleteGroup(id);
                                }}
                            >
                                ลบ
                            </Button>
                        </DialogActions>
                    </Dialog>
                </>
            )}

        </Box>
    );
}
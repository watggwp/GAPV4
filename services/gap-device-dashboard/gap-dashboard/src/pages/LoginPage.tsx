// src/pages/LoginPage.tsx
import { Box, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
                return;
            }

            const user = await res.json();
            login(user);
            navigate("/manage");
        } catch (err) {
            console.error("Login error:", err);
            setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        }
    };

    return (
        <Box sx={{ bgcolor: "#fefef8", minHeight: "100vh", width: "100vw", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Box sx={{
                p: 4,
                mx: 3,
                bgcolor: "#fff",
                borderRadius: 2,
                boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                minwidth: "100%",
                // maxWidth: 360,
                maxHeight: "300px"
            }}>
                <Box sx={{ mb: 2, textAlign: "center" }}>
                    <Typography fontSize={28} fontWeight={700} color="#507d2a">
                        🔐 Login
                    </Typography>
                </Box>

                <TextField
                    label="Username"
                    fullWidth
                    margin="normal"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {error && (
                    <Typography color="error" fontSize={14} mt={1}>
                        {error}
                    </Typography>
                )}

                <Button
                    variant="contained"
                    fullWidth
                    sx={{
                        mt: 2,
                        bgcolor: "#507d2a",
                        '&:hover': { bgcolor: "#3e651f" }
                    }}
                    onClick={handleLogin}
                >
                    Login
                </Button>
            </Box>
        </Box>
    );
}

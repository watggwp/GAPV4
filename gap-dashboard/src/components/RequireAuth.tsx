// src/components/RequireAuth.tsx
import type { JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth({ children }: { children: JSX.Element }) {
    const { user } = useAuth();

    return user ? children : <Navigate to="/login" replace />;
}
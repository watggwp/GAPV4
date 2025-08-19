// src/context/AuthContext.tsx
import { createContext, useContext, useState, type ReactNode } from "react";

interface AuthContextType {
    user: string | null;
    login: (username: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<string | null>(() => {
        return localStorage.getItem("authUser");
    });

    const login = (username: string) => {
        localStorage.setItem("authUser", username);
        setUser(username);
    };

    const logout = () => {
        localStorage.removeItem("authUser");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// ✅ ใช้ใน component
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth ต้องอยู่ใน <AuthProvider>");
    return context;
};

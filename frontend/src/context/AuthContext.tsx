import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserStats } from "../types";

type AuthContextType = {
    user: UserStats | null;
    isLoading: boolean;
    login: (userData: UserStats) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (userData: UserStats) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    login: async () => { },
    logout: async () => { },
    updateUser: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const userData = await AsyncStorage.getItem("anigo_user");
            if (userData) {
                setUser(JSON.parse(userData));
            }
        } catch (e) {
            console.error("Failed to load user data", e);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (userData: UserStats) => {
        try {
            await AsyncStorage.setItem("anigo_user", JSON.stringify(userData));
            setUser(userData);
        } catch (e) {
            console.error("Failed to save user data", e);
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem("anigo_user");
            setUser(null);
        } catch (e) {
            console.error("Failed to remove user data", e);
        }
    };

    const updateUser = async (userData: UserStats) => {
        try {
            await AsyncStorage.setItem("anigo_user", JSON.stringify(userData));
            setUser(userData);
        } catch (e) {
            console.error("Failed to update user data", e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

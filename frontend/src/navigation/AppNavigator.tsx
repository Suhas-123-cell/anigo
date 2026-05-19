import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthContext, AuthProvider } from "../context/AuthContext";
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import MapScreen from '../screens/MapScreen';
import AREncounterScreen from '../screens/AREncounterScreen';
import QuizScreen from '../screens/QuizScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CollectionsScreen from '../screens/CollectionsScreen';
import LeaderBoardScreen from '../screens/LeaderBoardScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import { RootStackParamList } from "../types";
import { ActivityIndicator, View } from "react-native";

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
    const { user, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#121212" }}>
                <ActivityIndicator size="large" color="#FF3B30" />
            </View>
        );
    }

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
            }}
        >
            {user == null ? (
                // Auth Flow
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Signup" component={SignupScreen} />
                    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                </>
            ) : (
                // Main Flow
                <>
                    <Stack.Screen name="Map" component={MapScreen} />
                    <Stack.Screen name="Profile" component={ProfileScreen} />
                    <Stack.Screen name="Collections" component={CollectionsScreen} />
                    <Stack.Screen name="Leaderboard" component={LeaderBoardScreen} />
                    <Stack.Screen name="AREncounter" component={AREncounterScreen} />
                    <Stack.Screen name="Quiz" component={QuizScreen} />
                </>
            )}
        </Stack.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <AuthProvider>
            <NavigationContainer>
                <RootNavigator />
            </NavigationContainer>
        </AuthProvider>
    );
}

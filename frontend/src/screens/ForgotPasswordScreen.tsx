import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    ActivityIndicator,
    ImageBackground,
    Animated,
    Easing,
    Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import API_BASE_URL, { DEFAULT_HEADERS } from '../constants/api';
import { useBackgroundPreload } from '../hooks/useBackgroundPreload';

export default function ForgotPasswordScreen({ navigation }: { navigation: NativeStackNavigationProp<any> }) {
    const [step, setStep] = useState<'username' | 'reset'>('username');
    const [username, setUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Preload background for instant rendering
    const backgroundSource = require('../../assets/sukuna-dark.png');
    useBackgroundPreload(backgroundSource);

    const hudAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(hudAnim, {
                toValue: 1,
                duration: 2600,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
            }),
        ).start();
    }, []);

    // ─── Step 1: Verify username exists ──────────────────────
    const handleVerifyUsername = async () => {
        if (!username.trim()) {
            Alert.alert('Error', 'Please enter your username.');
            return;
        }

        setIsLoading(true);
        try {
            // Check if user exists by trying to hit /auth/me — we just look for 404
            // Use reset-password with a dummy flow: actually we'll just move to step 2
            // A real check: we can call a lightweight endpoint
            const res = await fetch(`${API_BASE_URL}/auth/me/check?username=${encodeURIComponent(username.trim())}`, {
                headers: DEFAULT_HEADERS,
            });

            // Regardless of response, move to reset step
            // (avoids leaking whether username exists)
            setStep('reset');
        } catch (e) {
            setStep('reset'); // Still proceed
        } finally {
            setIsLoading(false);
        }
    };

    // ─── Step 2: Reset the password ──────────────────────────
    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in both password fields.');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: DEFAULT_HEADERS,
                body: JSON.stringify({ username: username.trim(), new_password: newPassword }),
            });

            if (!res.ok) {
                const errorBody = await res.text();
                console.error('Password reset failed:', res.status, errorBody);
                Alert.alert('Error', `Server error (${res.status}). Please try again.`);
                setIsLoading(false);
                return;
            }

            const data = await res.json();

            if (data.success) {
                Alert.alert(
                    '✅ Password Reset!',
                    'You can now log in with your new password.',
                    [{ text: 'Login', onPress: () => navigation.navigate('Login') }]
                );
            } else {
                Alert.alert('Failed', data.error ?? 'Could not reset password.');
                // If username not found, go back to step 1
                if (data.error?.includes('No account')) {
                    setStep('username');
                }
            }
        } catch (e) {
            Alert.alert('Error', 'Could not connect to the server.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ImageBackground
            source={backgroundSource}
            style={styles.background}
            resizeMode="cover"
            blurRadius={1}
        >
            <View style={styles.overlay} />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <Animated.View style={styles.card}>
                    {/* Animated top bar */}
                    <Animated.View style={{ height: 2, borderRadius: 999, marginBottom: 10, backgroundColor: '#450A0A', overflow: 'hidden' }}>
                        <Animated.View style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0, width: '35%',
                            backgroundColor: '#F87171', opacity: 0.9,
                            transform: [{ translateX: hudAnim.interpolate({ inputRange: [0, 1], outputRange: [-80, 200] }) }],
                        }} />
                    </Animated.View>

                    <Text style={styles.title}>Seal Recovery</Text>
                    <Text style={styles.subtitle}>
                        {step === 'username'
                            ? 'Enter your Hunter ID to continue'
                            : `Set a new seal phrase for "${username}"`}
                    </Text>

                    {step === 'username' ? (
                        <>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Cursed ID</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your hunter ID"
                                    placeholderTextColor="#6B7280"
                                    value={username}
                                    onChangeText={setUsername}
                                    autoCapitalize="none"
                                    autoFocus
                                />
                            </View>

                            <TouchableOpacity style={styles.button} onPress={handleVerifyUsername} disabled={isLoading}>
                                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue</Text>}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>New Seal Phrase</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Min. 6 characters"
                                    placeholderTextColor="#6B7280"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry
                                    autoFocus
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Confirm Seal Phrase</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Re-enter new password"
                                    placeholderTextColor="#6B7280"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                />
                            </View>

                            <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={isLoading}>
                                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.backLink} onPress={() => setStep('username')}>
                                <Text style={styles.backLinkText}>← Change username</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Remembered it? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.link}>Back to Login</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Animated bottom bar */}
                    <Animated.View style={{ height: 2, borderRadius: 999, marginTop: 14, backgroundColor: '#111827', overflow: 'hidden' }}>
                        <Animated.View style={{
                            position: 'absolute', right: 0, top: 0, bottom: 0, width: '28%',
                            backgroundColor: '#DC2626', opacity: 0.8,
                            transform: [{ translateX: hudAnim.interpolate({ inputRange: [0, 1], outputRange: [80, -200] }) }],
                        }} />
                    </Animated.View>
                </Animated.View>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    card: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: 'rgba(12,12,18,0.6)',
        paddingVertical: 24,
        paddingHorizontal: 20,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(248,113,113,0.6)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.7,
        shadowRadius: 28,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#F9FAFB',
        textAlign: 'center',
        marginBottom: 6,
        letterSpacing: 2,
        textShadowColor: 'rgba(248,113,113,0.9)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 18,
    },
    subtitle: {
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 22,
    },
    inputGroup: { marginBottom: 16 },
    inputLabel: { color: '#FCA5A5', fontSize: 12, marginBottom: 4, letterSpacing: 1 },
    input: {
        backgroundColor: 'rgba(9,9,15,0.45)',
        color: '#F9FAFB',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(248,113,113,0.85)',
    },
    button: {
        backgroundColor: '#020617',
        paddingVertical: 13,
        borderRadius: 999,
        alignItems: 'center',
        marginTop: 6,
        borderWidth: 1,
        borderColor: '#B91C1C',
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 18,
    },
    buttonText: { color: '#F9FAFB', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
    backLink: { alignItems: 'center', marginTop: 12 },
    backLinkText: { color: '#9CA3AF', fontSize: 13 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
    footerText: { color: '#9CA3AF', fontSize: 13 },
    link: { color: '#A5B4FC', fontSize: 13, fontWeight: '600' },
});

import React, { useState, useContext, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, ActivityIndicator, ImageBackground, useWindowDimensions, Animated, Easing, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { API, DEFAULT_HEADERS } from '../constants/api';
import { useBackgroundPreload } from '../hooks/useBackgroundPreload';

export default function LoginScreen({ navigation }: { navigation: NativeStackNavigationProp<any> }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useContext(AuthContext);

    const { width } = useWindowDimensions();
    const isSmallScreen = width < 768;

    const hudAnim = useRef(new Animated.Value(0)).current;
    const backgroundSource = require('../../assets/sukuna-dark.png');

    // Preload background for instant rendering
    useBackgroundPreload(backgroundSource);

    useEffect(() => {
        Animated.loop(
            Animated.timing(hudAnim, {
                toValue: 1,
                duration: 2600,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
            }),
        ).start();
    }, [hudAnim]);

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(API.login, {
                method: 'POST',
                headers: DEFAULT_HEADERS,
                body: JSON.stringify({ username, password })
            });

            const rawBody = await response.text();
            const contentType = response.headers.get('content-type') || '';

            let data: any = null;
            if (contentType.includes('application/json')) {
                try {
                    data = JSON.parse(rawBody);
                } catch {
                    data = null;
                }
            }

            if (response.ok && data && data.success) {
                await login(data.user);
            } else {
                const message =
                    data?.error ||
                    (rawBody?.trim().startsWith('<')
                        ? 'Server returned HTML instead of JSON. Check your API URL/tunnel.'
                        : 'Invalid credentials.');
                Alert.alert("Login Failed", message);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not connect to the server.");
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
                style={[styles.container, isSmallScreen && styles.containerSmall]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <Animated.View
                    style={[
                        styles.card,
                        isSmallScreen && styles.cardSmall,
                        {
                            transform: [
                                {
                                    translateY: hudAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, -2],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    <Animated.View
                        style={{
                            height: 2,
                            borderRadius: 999,
                            marginBottom: 10,
                            backgroundColor: '#450A0A',
                            overflow: 'hidden',
                        }}
                    >
                        <Animated.View
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: '35%',
                                backgroundColor: '#F87171',
                                opacity: 0.9,
                                transform: [
                                    {
                                        translateX: hudAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [-80, 200],
                                        }),
                                    },
                                ],
                            }}
                        />
                    </Animated.View>
                    <Text style={styles.title}>AniGO: Cursed Domain</Text>
                    <Text style={styles.subtitle}>Enter your hunter credentials</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Cursed ID</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your hunter ID"
                            placeholderTextColor="#9CA3AF"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            selectionColor="#FCA5A5"
                            cursorColor="#F87171"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Seal Phrase</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={[styles.input, styles.inputWithIcon]}
                                placeholder="Enter your seal phrase"
                                placeholderTextColor="#9CA3AF"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                selectionColor="#FCA5A5"
                                cursorColor="#F87171"
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowPassword(prev => !prev)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.eyeOuter, showPassword && styles.eyeOuterActive]}>
                                    <View style={[styles.eyeInner, showPassword && styles.eyeInnerActive]} />
                                    <View style={[styles.eyeSlash, showPassword && styles.eyeSlashActive]} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Enter Domain</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                            <Text style={styles.link}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={styles.forgotLink}
                        onPress={() => navigation.navigate('ForgotPassword')}
                    >
                        <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>
                    <Animated.View
                        style={{
                            height: 2,
                            borderRadius: 999,
                            marginTop: 14,
                            backgroundColor: '#111827',
                            overflow: 'hidden',
                        }}
                    >
                        <Animated.View
                            style={{
                                position: 'absolute',
                                right: 0,
                                top: 0,
                                bottom: 0,
                                width: '28%',
                                backgroundColor: '#DC2626',
                                opacity: 0.8,
                                transform: [
                                    {
                                        translateX: hudAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [80, -200],
                                        }),
                                    },
                                ],
                            }}
                        />
                    </Animated.View>
                </Animated.View>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    containerSmall: {
        paddingHorizontal: 20,
        paddingVertical: 32,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: 'rgba(12, 12, 18, 0.6)',
        paddingVertical: 24,
        paddingHorizontal: 20,
        borderRadius: 22,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.7,
        shadowRadius: 28,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(248, 113, 113, 0.6)',
    },
    cardSmall: {
        maxWidth: '100%',
        width: '100%',
    },
    title: {
        fontSize: 30,
        fontWeight: '900',
        color: '#F9FAFB',
        textAlign: 'center',
        marginBottom: 6,
        letterSpacing: 2,
        textShadowColor: 'rgba(248, 113, 113, 0.9)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 18,
    },
    subtitle: {
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 22,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        color: '#FCA5A5',
        fontSize: 12,
        marginBottom: 4,
        letterSpacing: 1,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(9, 9, 15, 0.7)',
        color: '#FFFFFF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        fontSize: 16,
        borderWidth: 2,
        borderColor: 'rgba(248, 113, 113, 1)',
        selectionColor: '#FCA5A5',
        placeholderTextColor: '#9CA3AF',
    },
    inputWithIcon: {
        marginRight: 6,
    },
    eyeButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    eyeOuter: {
        width: 24,
        height: 16,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#6B7280',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    eyeOuterActive: {
        borderColor: '#FCA5A5',
        shadowColor: '#F87171',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
    },
    eyeInner: {
        width: 10,
        height: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#6B7280',
        backgroundColor: 'transparent',
    },
    eyeInnerActive: {
        borderColor: '#F97373',
        backgroundColor: '#7F1D1D',
    },
    eyeSlash: {
        position: 'absolute',
        width: 24,
        height: 1,
        backgroundColor: '#6B7280',
        transform: [{ rotate: '-35deg' }],
    },
    eyeSlashActive: {
        backgroundColor: '#FCA5A5',
    },
    button: {
        backgroundColor: '#020617',
        paddingVertical: 13,
        borderRadius: 999,
        alignItems: 'center',
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#B91C1C',
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 18,
    },
    buttonText: {
        color: '#F9FAFB',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 18,
    },
    footerText: {
        color: '#9CA3AF',
        fontSize: 13,
    },
    link: {
        color: '#A5B4FC',
        fontSize: 13,
        fontWeight: '600',
    },
    forgotLink: {
        alignItems: 'center',
        marginTop: 10,
    },
    forgotText: {
        color: '#9CA3AF',
        fontSize: 13,
        textDecorationLine: 'underline',
    },
});

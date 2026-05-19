import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ImageBackground,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Spawn } from '../types';
import { AuthContext } from '../context/AuthContext';
import { API, DEFAULT_HEADERS } from '../constants/api';
import { playSuccessFeedback, playErrorFeedback } from '../utils/hapticAndSound';
import { useBackgroundPreload } from '../hooks/useBackgroundPreload';

type Props = NativeStackScreenProps<RootStackParamList, 'Quiz'>;

type QuestionType = 'anime' | 'tech';

interface Question {
    type: QuestionType;
    text: string;
    answer: string;
    options: string[];
}

const ANIME_QUESTIONS = [
    { text: 'What is Naruto\'s most famous jutsu?', answer: 'Rasengan', options: ['Rasengan', 'Chidori', 'Kamehameha', 'Spirit Bomb'] },
    { text: 'Which anime has the character Ichigo?', answer: 'Bleach', options: ['Bleach', 'Naruto', 'One Piece', 'Dragon Ball'] },
    { text: 'What is Goku\'s signature move?', answer: 'Kamehameha', options: ['Kamehameha', 'Kaioken', 'Ultra Instinct', 'Spirit Bomb'] },
    { text: 'What is the name of Luffy\'s rubber fruit power?', answer: 'Gomu Gomu no Mi', options: ['Gomu Gomu no Mi', 'Hie Hie no Mi', 'Gura Gura no Mi', 'Pika Pika no Mi'] },
    { text: 'Who is the main character in My Hero Academia?', answer: 'Deku', options: ['Deku', 'Bakugo', 'All Might', 'Todoroki'] },
    { text: 'What does Jujutsu Kaisen\'s main character Yuji fight?', answer: 'Curses', options: ['Curses', 'Demons', 'Hollows', 'Titans'] },
    { text: 'What year did Dragon Ball first air?', answer: '1986', options: ['1986', '1990', '1996', '2000'] },
    { text: 'Who is Sasuke\'s best friend?', answer: 'Naruto', options: ['Naruto', 'Kakashi', 'Sakura', 'Itachi'] },
    { text: 'What is the name of Demon Slayer\'s main character?', answer: 'Tanjiro', options: ['Tanjiro', 'Nezuko', 'Zenitsu', 'Inosuke'] },
    { text: 'Which anime has the character Eren Yeager?', answer: 'Attack on Titan', options: ['Attack on Titan', 'Demon Slayer', 'Jujutsu Kaisen', 'My Hero Academia'] },
    { text: 'What is the name of the sword Tanjiro uses?', answer: 'Nichirin Sword', options: ['Nichirin Sword', 'Kusanagi', 'Excalibur', 'Zanpakuto'] },
    { text: 'Which character from One Piece is a swordsman?', answer: 'Zoro', options: ['Zoro', 'Nami', 'Chopper', 'Franky'] },
    { text: 'What is the name of the organization Saitama joins?', answer: 'Hero Association', options: ['Hero Association', 'Z-City Guard', 'Monster Hunters', 'Defenders'] },
    { text: 'Who is the villain in Jujutsu Kaisen?', answer: 'Sukuna', options: ['Sukuna', 'Mahito', 'Hanami', 'Jogo'] },
    { text: 'What is Todoroki\'s quirk in My Hero Academia?', answer: 'Half-Cold Half-Hot', options: ['Half-Cold Half-Hot', 'Freeze', 'Fire Control', 'Temperature'] },
    { text: 'Which anime features ninjas from the Hidden Leaf Village?', answer: 'Naruto', options: ['Naruto', 'Bleach', 'One Piece', 'Jujutsu Kaisen'] },
    { text: 'What does Nezuko become in Demon Slayer?', answer: 'A Demon', options: ['A Demon', 'A Slayer', 'A Spirit', 'A Titan'] },
    { text: 'Who is the main antagonist in Attack on Titan?', answer: 'The Titans', options: ['The Titans', 'Marley', 'The Military', 'The Government'] },
    { text: 'What is the power source in My Hero Academia?', answer: 'Quirk', options: ['Quirk', 'Chi', 'Chakra', 'Curse'] },
    { text: 'Which anime has Pikachu as a main character?', answer: 'Pokemon', options: ['Pokemon', 'Digimon', 'Yo-kai Watch', 'Nexo Knights'] },
];

const TECH_QUESTIONS = [
    { text: 'What does HTML stand for?', answer: 'HyperText Markup Language', options: ['HyperText Markup Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language', 'Home Text Markup Language'] },
    { text: 'What does CSS stand for?', answer: 'Cascading Style Sheets', options: ['Cascading Style Sheets', 'Computer Style Sheets', 'Colorful Style System', 'Code Style Syntax'] },
    { text: 'Which company created JavaScript?', answer: 'Netscape', options: ['Netscape', 'Google', 'Microsoft', 'Apple'] },
    { text: 'What is the fastest programming language?', answer: 'C', options: ['C', 'Python', 'JavaScript', 'Java'] },
    { text: 'What does AI stand for?', answer: 'Artificial Intelligence', options: ['Artificial Intelligence', 'Advanced Internet', 'Automated Interface', 'Algorithmic Information'] },
    { text: 'What does API stand for?', answer: 'Application Programming Interface', options: ['Application Programming Interface', 'Advanced Program Integration', 'Application Process Interrupt', 'Automated Programming Interface'] },
    { text: 'Which is a version control system?', answer: 'Git', options: ['Git', 'Slack', 'Figma', 'Zoom'] },
    { text: 'What language powers most web apps?', answer: 'JavaScript', options: ['JavaScript', 'C++', 'Java', 'Ruby'] },
    { text: 'What does JSON stand for?', answer: 'JavaScript Object Notation', options: ['JavaScript Object Notation', 'Java Server Online Network', 'JavaScript Operations Notation', 'Java Standard Output Notation'] },
    { text: 'What is the purpose of a database?', answer: 'Store and organize data', options: ['Store and organize data', 'Display web pages', 'Run programs', 'Create animations'] },
    { text: 'Which is a popular Python framework?', answer: 'Django', options: ['Django', 'Angular', 'React', 'Vue'] },
    { text: 'What does SQL stand for?', answer: 'Structured Query Language', options: ['Structured Query Language', 'Simple Query Language', 'Standard Query Language', 'Sequential Query Language'] },
    { text: 'Which company is known for cloud computing?', answer: 'AWS', options: ['AWS', 'GitHub', 'GitLab', 'Docker'] },
    { text: 'What does HTTP stand for?', answer: 'HyperText Transfer Protocol', options: ['HyperText Transfer Protocol', 'Home Transfer Text Protocol', 'High Transfer Text Protocol', 'Home Tool Transfer Protocol'] },
    { text: 'Which is a NoSQL database?', answer: 'MongoDB', options: ['MongoDB', 'PostgreSQL', 'MySQL', 'Oracle'] },
    { text: 'What is React used for?', answer: 'Building User Interfaces', options: ['Building User Interfaces', 'Database Management', 'Server Configuration', 'Network Security'] },
    { text: 'Which is a mobile development framework?', answer: 'React Native', options: ['React Native', 'Angular', 'Vue', 'Svelte'] },
    { text: 'What does DevOps stand for?', answer: 'Development and Operations', options: ['Development and Operations', 'Developer Operations', 'Development Operations Tool', 'Device Operations'] },
    { text: 'Which language is used for web development?', answer: 'JavaScript', options: ['JavaScript', 'C#', 'Swift', 'Go'] },
    { text: 'What is Docker used for?', answer: 'Containerization', options: ['Containerization', 'Version Control', 'Package Management', 'Code Compilation'] },
];

const generateQuestion = (): Question => {
    const categories = [ANIME_QUESTIONS, TECH_QUESTIONS];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const selectedQuestion = category[Math.floor(Math.random() * category.length)];
    
    // Shuffle options
    const shuffledOptions = [...selectedQuestion.options].sort(() => Math.random() - 0.5);
    
    return {
        type: category === ANIME_QUESTIONS ? 'anime' : 'tech',
        text: selectedQuestion.text,
        answer: selectedQuestion.answer,
        options: shuffledOptions,
    };
};

export default function QuizScreen({ route, navigation }: Props) {
    const { spawn } = route.params;
    const { user, updateUser } = useContext(AuthContext);
    const [question, setQuestion] = useState<Question>(generateQuestion());
    const [loading, setLoading] = useState(false);
    const [answered, setAnswered] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

    // Preload background for instant rendering
    const backgroundSource = require('../../assets/sukuna-dark.png');
    useBackgroundPreload(backgroundSource);

    const getQuestionText = (): string => {
        return question.text;
    };

    const handleAnswerSelect = async (selectedOption: string) => {
        setSelectedAnswer(selectedOption);
        setAnswered(true);

        if (selectedOption === question.answer) {
            // Correct answer - add to inventory
            if (!user || !user.id) {
                Alert.alert('Error', 'You must be logged in to catch a character.');
                return;
            }
            
            setLoading(true);
            try {
                const response = await fetch(API.catch, {
                    method: 'POST',
                    headers: DEFAULT_HEADERS,
                    body: JSON.stringify({
                        user_id: user?.id,
                        spawn_id: spawn.id,
                        character_name: spawn.character,
                        rarity: spawn.rarity || 'common',
                        lat: spawn.lat,
                        lng: spawn.lng,
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Backend error:', response.status, errorText);
                    Alert.alert('Error', `Server error (${response.status}). Please try again.`);
                    setLoading(false);
                    return;
                }

                // Ensure content-type is JSON before parsing
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    console.error('Invalid response content-type:', contentType);
                    const text = await response.text();
                    console.error('Response body:', text);
                    Alert.alert('Error', 'Server returned invalid response format. Please try again.');
                    setLoading(false);
                    return;
                }

                const data = await response.json();

                if (data.success) {
                    // Trigger success haptic feedback
                    playSuccessFeedback();
                    
                    // Update user context with new XP and level
                    if (user) {
                        
                        updateUser({
                            ...user,
                            total_xp: data.total_xp,
                            level: data.level,
                        });
                    }

                    Alert.alert(
                        '🎉 Correct!',
                        `You caught ${spawn.character}!\n\nXP Gained: +${data.xp_gained}${data.leveled_up ? '\n\nLevel Up! 🎊' : ''}`,
                        [
                            {
                                text: 'Go to Collections',
                                onPress: () => navigation.navigate('Collections'),
                            },
                            {
                                text: 'Back to Map',
                                onPress: () => navigation.navigate('Map'),
                            },
                        ]
                    );
                } else {
                    // Trigger error haptic feedback
                    playErrorFeedback();
                    Alert.alert('Error', data.error || data.message || 'Failed to catch character');
                }
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                console.error('Failed to catch character:', err);
                Alert.alert('Error', `Server error: ${errorMsg}`);
            } finally {
                setLoading(false);
            }
        } else {
            // Incorrect answer - character flees for this user
            try {
                await fetch(`${API.baseUrl}/game/flee`, {
                    method: 'POST',
                    headers: DEFAULT_HEADERS,
                    body: JSON.stringify({
                        spawn_id: spawn.id,
                        user_id: user?.id,
                    }),
                });
            } catch (err) {
                console.error('Failed to remove spawn:', err);
            }

            Alert.alert(
                '❌ Wrong Answer!',
                `The answer is ${question.answer}.\n\n💨 The character fled away!`,
                [
                    {
                        text: 'Back to Map',
                        onPress: () => navigation.navigate('Map'),
                    },
                ]
            );
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
            <View style={styles.container}>
                {/* Character Name */}
                <Text style={styles.characterName}>{spawn.character}</Text>
                <Text style={styles.rarity}>{spawn.rarity?.toUpperCase() || 'COMMON'}</Text>

                {/* Question Box */}
                <View style={styles.questionBox}>
                    <Text style={styles.questionText}>{getQuestionText()}</Text>
                </View>

                {/* Options Grid */}
                <View style={styles.optionsContainer}>
                    <View style={styles.optionsRow}>
                        {question.options.slice(0, 2).map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.optionButton,
                                    selectedAnswer === option && styles.optionButtonSelected,
                                    selectedAnswer === option && option === question.answer && styles.optionButtonCorrect,
                                    selectedAnswer === option && option !== question.answer && styles.optionButtonIncorrect,
                                ]}
                                onPress={() => !answered && handleAnswerSelect(option)}
                                disabled={answered || loading}
                                activeOpacity={0.7}
                            >
                                {loading && selectedAnswer === option && (
                                    <ActivityIndicator size="small" color="#FFF" />
                                )}
                                <Text style={styles.optionText}>{option}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.optionsRow}>
                        {question.options.slice(2, 4).map((option, index) => (
                            <TouchableOpacity
                                key={index + 2}
                                style={[
                                    styles.optionButton,
                                    selectedAnswer === option && styles.optionButtonSelected,
                                    selectedAnswer === option && option === question.answer && styles.optionButtonCorrect,
                                    selectedAnswer === option && option !== question.answer && styles.optionButtonIncorrect,
                                ]}
                                onPress={() => !answered && handleAnswerSelect(option)}
                                disabled={answered || loading}
                                activeOpacity={0.7}
                            >
                                {loading && selectedAnswer === option && (
                                    <ActivityIndicator size="small" color="#FFF" />
                                )}
                                <Text style={styles.optionText}>{option}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.navigate('Map')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.backButtonText}>← Back to Map</Text>
                </TouchableOpacity>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    characterName: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FF3B30',
        marginBottom: 8,
        textAlign: 'center',
    },
    rarity: {
        fontSize: 14,
        color: '#FFD700',
        marginBottom: 40,
        fontWeight: '600',
        letterSpacing: 2,
    },
    questionBox: {
        backgroundColor: 'rgba(18, 18, 24, 0.8)',
        borderRadius: 16,
        padding: 24,
        marginBottom: 40,
        borderWidth: 2,
        borderColor: 'rgba(255, 59, 48, 0.5)',
        width: '100%',
        alignItems: 'center',
    },
    questionText: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
    },
    optionsContainer: {
        width: '100%',
        marginBottom: 40,
        gap: 12,
    },
    optionsRow: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'space-between',
    },
    optionButton: {
        flex: 1,
        backgroundColor: 'rgba(100, 100, 120, 0.6)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        minHeight: 60,
    },
    optionButtonSelected: {
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    optionButtonCorrect: {
        backgroundColor: 'rgba(76, 175, 80, 0.7)',
        borderColor: '#4CAF50',
    },
    optionButtonIncorrect: {
        backgroundColor: 'rgba(244, 67, 54, 0.7)',
        borderColor: '#F44336',
    },
    optionText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    backButton: {
        backgroundColor: 'rgba(100, 100, 120, 0.6)',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});

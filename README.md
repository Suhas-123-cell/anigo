# 🎮 AniGO — Pokémon GO for Anime Characters

**AniGO** is a location-based augmented reality mobile game where players explore the real world to discover, catch, and collect their favorite anime characters. Think Pokémon GO, but with characters from Naruto, One Piece, Jujutsu Kaisen, Attack on Titan, Demon Slayer, and more!

Built with **React Native (Expo)** and a **Node.js/Express** backend powered by **Supabase**.

---

## ✨ Features

- 🗺️ **Real-time Map Exploration** — Walk around the real world with a live interactive map
- 🎯 **Character Spawning** — Anime characters spawn near your location based on rarity tiers
- 🏆 **Catch & Collect** — Build your anime character collection with quiz-based encounters
- 📊 **Leaderboard** — Compete with other players globally
- 🧭 **3D Navigation System** — Compass and 3D directional indicators guide you to nearby spawns
- 🎨 **Rarity System** — Common, Rare, Legendary, and Black-tier characters
- 👤 **User Profiles** — Track your stats, catches, and collection progress
- 📱 **Cross-platform** — Works on iOS and Android via Expo Go
- 🧊 **3D Character Models** — GLB model integration for immersive player markers
- ⚡ **Optimized Backgrounds** — Preloaded anime-themed backgrounds for instant rendering

---

## 🏗️ Tech Stack

| Layer       | Technology                                      |
| ----------- | ----------------------------------------------- |
| **Frontend**| React Native, Expo SDK 54, TypeScript           |
| **3D/AR**   | Three.js, @react-three/fiber, expo-gl           |
| **Maps**    | react-native-maps (Google Maps)                 |
| **Backend** | Node.js, Express.js                             |
| **Database**| Supabase (PostgreSQL)                           |
| **Auth**    | Custom auth with bcrypt                         |

---

## 📁 Project Structure

```
anigo/
├── frontend/                 # React Native (Expo) mobile app
│   ├── App.tsx               # App entry point with navigation
│   ├── app.json              # Expo configuration
│   ├── src/
│   │   ├── screens/          # App screens
│   │   │   ├── MapScreen.tsx          # Main game map
│   │   │   ├── LoginScreen.tsx        # User login
│   │   │   ├── SignupScreen.tsx       # User registration
│   │   │   ├── CollectionsScreen.tsx  # Character collection
│   │   │   ├── LeaderBoardScreen.tsx  # Global leaderboard
│   │   │   ├── ProfileScreen.tsx      # User profile & stats
│   │   │   ├── QuizScreen.tsx         # Quiz-based catching
│   │   │   ├── AREncounterScreen.tsx  # AR encounter mode
│   │   │   └── ForgotPasswordScreen.tsx
│   │   ├── components/       # Reusable UI components
│   │   │   ├── MapView.tsx            # Map wrapper (native)
│   │   │   ├── MapView.web.tsx        # Map wrapper (web)
│   │   │   ├── UserLocationModel.tsx  # 3D player marker
│   │   │   └── RotatingCharacterBadge.tsx
│   │   ├── hooks/            # Custom React hooks
│   │   ├── context/          # React context providers
│   │   ├── navigation/       # Navigation configuration
│   │   ├── utils/            # Utility functions
│   │   ├── constants/        # App constants & API config
│   │   └── types/            # TypeScript type definitions
│   └── assets/               # Images, icons, character art
│
├── backend/                  # Node.js API server
│   ├── server.js             # Express server entry point
│   ├── config.js             # Server configuration
│   ├── db.js                 # Supabase database connection
│   ├── spawner.js            # Character spawn logic & algorithms
│   ├── routes/
│   │   ├── index.js          # Route aggregator
│   │   ├── auth.js           # Authentication endpoints
│   │   ├── spawns.js         # Spawn management endpoints
│   │   ├── game.js           # Game logic endpoints
│   │   ├── badges.js         # Badge/achievement endpoints
│   │   └── admin.js          # Admin panel endpoints
│   └── middleware/
│       ├── errorHandler.js   # Global error handling
│       └── validate.js       # Request validation
│
├── database/                 # SQL schema & migrations
│   ├── supabase_schema.sql   # Main Supabase schema
│   ├── create_characters_table.sql
│   ├── add_characters_table.sql
│   └── ...                   # Other migration scripts
│
└── admin.html                # Admin dashboard (standalone)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **npm**
- **Expo Go** app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- A **Supabase** project ([supabase.com](https://supabase.com))
- A **Google Maps API key** ([Google Cloud Console](https://console.cloud.google.com/))

### 1. Clone the Repository

```bash
git clone https://github.com/Suhas-123-cell/anigo.git
cd anigo
```

### 2. Set Up the Database

1. Create a new project on [Supabase](https://supabase.com)
2. Open the **SQL Editor** in your Supabase dashboard
3. Run the schema from `database/supabase_schema.sql`
4. (Optional) Populate characters with `database/add_characters_table.sql`

### 3. Configure the Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
```

Start the server:

```bash
npm run dev
```

The server will display your local IP address for Expo Go connection.

### 4. Configure the Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```env
EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:3001/api
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

> 💡 **Tip**: Use the IP address shown when the backend starts (e.g., `http://192.168.1.5:3001/api`). Your phone and computer must be on the same WiFi network.

Start the app:

```bash
npx expo start
```

Scan the QR code with Expo Go on your phone.

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint              | Description            |
| ------ | --------------------- | ---------------------- |
| POST   | `/api/auth/signup`    | Create a new account   |
| POST   | `/api/auth/login`     | Log in                 |
| GET    | `/api/auth/me/:id`    | Get user info          |

### Spawns
| Method | Endpoint              | Description                   |
| ------ | --------------------- | ----------------------------- |
| GET    | `/api/spawns`         | Get all active spawns         |
| GET    | `/api/spawns/:id`     | Get a specific spawn          |
| POST   | `/api/spawns/near`    | Generate spawns near location |

### Game
| Method | Endpoint                    | Description          |
| ------ | --------------------------- | -------------------- |
| POST   | `/api/game/catch`           | Catch a character    |
| GET    | `/api/game/inventory/:id`   | Get user inventory   |
| GET    | `/api/game/stats/:id`       | Get user stats       |
| GET    | `/api/game/leaderboard`     | Global leaderboard   |

---

## 🎭 Anime Series Included

Characters from popular anime series including:

- **Naruto** — Naruto, Sasuke, Kakashi, Itachi, Hinata, Sakura, Rock Lee
- **One Piece** — Luffy, Zoro, Nami, Sanji, Usopp, Shanks, Chopper
- **Jujutsu Kaisen** — Gojo, Sukuna, Yuji, Megumi, Nobara, Toji, Yuta
- **Attack on Titan** — Eren, Mikasa, Levi, Armin, Sasha
- **Demon Slayer** — Tanjiro, Nezuko, Zenitsu, Inosuke
- **My Hero Academia** — Shoto, Ochaco, Tenya
- **And more** — Dragon Ball, Bleach, Fullmetal Alchemist, Chainsaw Man, Re:Zero, One Punch Man, Solo Leveling, Cowboy Bebop...

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is for educational and personal use.

---

<p align="center">
  <b>Built with ❤️ by anime fans, for anime fans</b>
</p>

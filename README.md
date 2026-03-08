<div align="center">

# 🏃 STRYDE

### Walk. Earn. Own.

**A walk-to-earn fitness app built natively on Solana Mobile.**  
Every step you take earns real $SKR tokens — minted on-chain, sent directly to your wallet.

[![Built on Solana](https://img.shields.io/badge/Built%20on-Solana-9945FF?style=for-the-badge&logo=solana)](https://solana.com)
[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway)](https://railway.app)

</div>

---

## What is Stryde?

Stryde turns your daily walks into on-chain rewards. Connect your Solana wallet, go for a walk, and earn $SKR tokens — verified server-side and minted directly to your wallet on Solana.

No NFT required to start. No pay-to-play. No centralized token system you don't control.

---

## Why Stryde?

| App | Problem |
|-----|---------|
| **STEPN** | Requires buying an NFT sneaker ($100–500+) before earning |
| **Sweatcoin** | Centralized — tokens live on their servers, not your wallet |
| **Strava** | Tracks everything, rewards you nothing |
| **Stryde** ✅ | No NFT needed, real SPL tokens, wallet-first, fully on-chain |

---

## How It Works

```
1. Connect Solana Wallet  →  Wallet-first auth, no email or password
2. Start a Walk           →  GPS + pedometer tracking begins
3. Walk & Move            →  Steps, distance, pace tracked in real time
4. Stop & Submit          →  Walk data sent to server for verification
5. Anti-Cheat Checks      →  Speed limits, GPS consistency, step validation
6. Tokens Minted          →  $SKR SPL tokens minted to your wallet on Solana
7. Balance Updates         →  Profile shows updated token balance instantly
```

---

## Features

### ✅ Built & Working
- **Wallet-first authentication** via Solana Mobile Wallet Adapter — no email, no password
- **Live walk tracking** — GPS distance (Haversine), pedometer steps (expo-sensors), real-time pace
- **Server-side anti-cheat** — speed limit enforcement, GPS consistency checks, step validation
- **On-chain token minting** — $SKR SPL tokens minted to user wallet after walk verification
- **Activity summary** — distance, duration, pace, calories, steps, and $SKR earned
- **Token balance** — live $SKR balance on profile screen
- **Multiple activity types** — walk, run, hike, ride (each with different reward multipliers)
- **JWT auth with auto-refresh** — seamless session management across walks
- **Railway-deployed backend** — live production API

### 🗺️ Roadmap
- **Token Shop** — spend $SKR for real discounts; tokens burned on-chain
- **Challenges** — stake tokens against other users, walk the most, winner takes pot
- **Seeker Genesis NFT** — holders earn 1.5x token multiplier on every walk
- **Leaderboards** — weekly and all-time rankings
- **Avatar & profile images** — Cloudinary upload

---

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| Expo (React Native) | Cross-platform mobile app |
| Expo Router | File-based navigation |
| Solana Mobile Wallet Adapter | Wallet connection & auth |
| expo-location | GPS tracking |
| expo-sensors | Pedometer step counting |
| Zustand | State management |
| TypeScript | Type safety |

### Backend
| Technology | Purpose |
|-----------|---------|
| Express + TypeScript | REST API |
| MongoDB + Mongoose | Database |
| JWT (access + refresh) | Authentication |
| @solana/web3.js | Token minting |
| @solana/spl-token | $SKR SPL token management |
| Railway | Deployment |

### Solana
| Item | Value |
|------|-------|
| Network | Devnet |
| Token | $SKR (custom SPL token) |
| Minting | Server-side via treasury wallet after walk verification |
| RPC | https://api.devnet.solana.com |

---

## Project Structure

```
Stryde/
├── app/                        # Expo Router screens
│   ├── (tabs)/
│   │   ├── feed.tsx            # Home feed
│   │   ├── record.tsx          # Walk tracking screen
│   │   ├── profile.tsx         # Token balance & stats
│   │   └── shop.tsx            # Coming soon
│   ├── activity-summary.tsx    # Post-walk summary + token reward
│   ├── connect.tsx             # Wallet connection screen
│   └── profile-setup.tsx       # New user onboarding
├── src/
│   ├── components/             # Shared UI components
│   ├── services/               # API calls (auth, walks, wallet)
│   └── types/                  # TypeScript interfaces
├── store/
│   ├── authStore.ts            # Wallet auth state
│   ├── activityStore.ts        # Live walk tracking state
│   └── activitiesStore.ts      # Walk history state
├── hooks/                      # Custom React hooks
├── assets/                     # Icons, images, fonts
└── app.config.ts               # Expo configuration
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Android device or emulator (Solana Mobile Wallet Adapter requires Android)
- [Mock MWA](https://github.com/solana-mobile/mobile-wallet-adapter/tree/main/android/fakewallet) installed on your Android device for testing
- Expo CLI: `npm install -g expo-cli`

### 1. Clone the repo

```bash
git clone https://github.com/Sanusi-Moshood/Stryde.git
cd Stryde
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root:

```env
EXPO_PUBLIC_BASE_URL=https://stryde-server-production.up.railway.app/api
MAP_API_KEY=your_google_maps_api_key
```

> The backend is live at Railway — you don't need to run it locally.

### 4. Build and run on Android

```bash
npx expo run:android
```

> **Note:** `npx expo start` alone won't work — the app uses native modules (Solana MWA, pedometer) that require a native build.

### 5. Set up Mock MWA (for wallet testing)

1. Download and install [Mock MWA APK](https://github.com/solana-mobile/mobile-wallet-adapter/releases) on your Android device
2. Open Mock MWA and tap **Authenticate**
3. Open Stryde and tap **Connect Wallet**
4. Approve the connection in Mock MWA

---

## Backend

The backend is deployed and live — no local setup needed for judges.

**API Base URL:** `https://stryde-server-production.up.railway.app/api`

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/connect` | Connect wallet, get JWT tokens |
| GET | `/auth/me` | Get current user profile |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/walks/submit` | Submit a completed walk |
| GET | `/walks/history` | Get user's walk history |
| GET | `/walks/stats` | Get user's walking stats |

### Running the Backend Locally (Optional)

The backend lives in a separate private repo. To run locally you'll need:

```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SERVER_WALLET_PRIVATE_KEY=your_server_wallet_key
WALK_TOKEN_MINT_ADDRESS=your_mint_address
PORT=5000
NODE_ENV=development
```

---

## Token Reward System

```
Activity Type   Base Rate       Max Speed    Multiplier
─────────────────────────────────────────────────────
Walk            10 $SKR/km      10 km/h      1.0x
Run             10 $SKR/km      35 km/h      1.5x
Hike            10 $SKR/km      15 km/h      1.8x
Ride            10 $SKR/km      60 km/h      0.8x

Seeker Genesis NFT holders: +1.5x bonus on all activities
```

Anti-cheat runs server-side before any tokens are minted.

---

## Team

**Sanusi Moshood** — Full-stack developer  
[GitHub](https://github.com/Sanusi-Moshood)

---

## Hackathon

Built for the **Solana Mobile Hackathon**  

Stryde demonstrates real-world utility of Solana Mobile — wallet-native auth, on-chain rewards, and a genuinely useful fitness app that lives entirely in the user's wallet ecosystem.

---

<div align="center">

**No NFT required. No pay-to-play. Just walk, verify on-chain, earn real tokens.**

</div>

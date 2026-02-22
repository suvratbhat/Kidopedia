<div align="center">
  <img src="./assets/images/icon.png" alt="Kidopedia Logo" width="120" height="120">

  # 🚀 Kidopedia

  **The Ultimate Kid-Friendly Dictionary & Learning Adventure**

  *Making vocabulary learning fun, safe, and engaging for children aged 2-12*

  [![Build APK](https://github.com/yourusername/kidopedia/actions/workflows/build-apk.yml/badge.svg)](https://github.com/yourusername/kidopedia/actions/workflows/build-apk.yml)
  [![Made with Expo](https://img.shields.io/badge/Made%20with-Expo-blue.svg)](https://expo.dev)
  [![React Native](https://img.shields.io/badge/React%20Native-0.81-blue.svg)](https://reactnative.dev/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

  [Download APK](#-download) • [Features](#-features) • [Screenshots](#-screenshots) • [Getting Started](#-getting-started)
</div>

---

## 📖 About Kidopedia

Kidopedia transforms dictionary lookup into an exciting learning adventure designed specifically for children. Built with love using React Native and Expo, this app combines education with entertainment, helping kids explore new words while tracking their learning journey.

Whether your child is 2 or 12, Kidopedia adapts to their age with appropriate content filtering, personalized learning paths, and a gamified experience that makes vocabulary building feel like play!

### 🎯 Why Kidopedia?

- **🛡️ Safe & Secure**: Age-appropriate content filtering ensures kids only see suitable definitions and examples
- **👶 Multi-Profile Support**: Separate profiles for each child with individual progress tracking
- **🎮 Gamified Learning**: Earn XP, unlock achievements, maintain streaks, and level up!
- **📚 Rich Dictionary**: Powered by comprehensive dictionary data with definitions, examples, and pronunciations
- **🔊 Audio Support**: Text-to-speech functionality helps kids learn correct pronunciation
- **⭐ Smart Favorites**: Save favorite words for quick review and study
- **📱 Offline-First**: Works seamlessly even without internet connection
- **🎨 Beautiful UI**: Colorful, kid-friendly interface that's engaging and easy to navigate

---

## ✨ Features

### 🔍 Smart Search & Discovery
- **Lightning-fast word search** with intelligent caching
- **Random word discovery** - "Surprise Me!" button for spontaneous learning
- **Recent searches** tracking for quick access
- **Category browsing** - Explore words by themes (Animals, Food, Space, Sports, etc.)
- **Content filtering** - Age-appropriate search results and definitions

![Search Demo](./screenshots/search-demo.gif)
*Experience instant word search with kid-friendly results*

### 👤 Personalized Kid Profiles
- **Multiple profiles** - One app for the whole family
- **Custom avatars** - Fun, diverse avatar options with color customization
- **Age-based content** - Automatically adjusts difficulty and filtering
- **Individual progress** - Each child's learning journey is unique
- **Profile management** - Easy switching, editing, and deletion

![Profiles](./screenshots/profiles.png)
*Create personalized profiles for each child*

### 🎓 Learning Progress & Gamification
- **XP System** - Earn experience points for every word learned
- **Level progression** - Watch your child advance through learning levels
- **Achievement badges** - Unlock rewards for milestones
- **Daily streaks** - Build consistent learning habits
- **Stats tracking** - Words learned, favorites saved, total XP earned

![Progress Dashboard](./screenshots/progress-dashboard.png)
*Track learning achievements and celebrate milestones*

### 📚 Comprehensive Word Details
- **Multiple definitions** - Understand words in different contexts
- **Part of speech** - Learn grammar naturally (noun, verb, adjective, etc.)
- **Example sentences** - See words used in real contexts
- **Phonetic pronunciation** - Learn to say words correctly
- **Audio playback** - Hear proper pronunciation
- **Synonyms & antonyms** - Expand vocabulary naturally

![Word Detail](./screenshots/word-detail.png)
*Detailed word information designed for young learners*

### ⭐ Favorites & Collections
- **Bookmark words** - Save interesting discoveries
- **Quick access** - Review favorites anytime
- **Study lists** - Build personal vocabulary collections
- **Favorite count tracking** - See your collection grow

### 🎨 Delightful User Experience
- **Colorful themes** - Vibrant, age-appropriate color schemes
- **Smooth animations** - Engaging micro-interactions throughout
- **Intuitive navigation** - Tab-based design that kids understand
- **Large touch targets** - Easy for small fingers to tap
- **Progress indicators** - Visual feedback for all actions

### 🔐 Safe & Secure
- **Age-appropriate filtering** - Content automatically adjusted by child's age
- **No ads** - Distraction-free, safe learning environment
- **Privacy-focused** - Data stored securely with Supabase
- **Parental controls** - Manage profiles and monitor progress

### 🌐 Coming Soon
- **Learning Paths** - Structured vocabulary lessons by theme
- **Daily Quests** - Fun challenges to encourage daily learning
- **Story Mode** - Learn words through interactive stories
- **Brain Trainer** - Memory and vocabulary games
- **Challenge Arena** - Quiz yourself on learned words

---

## 📸 Screenshots

<div align="center">
  <img src="./screenshots/home-screen.png" alt="Home Screen" width="200">
  <img src="./screenshots/search-results.png" alt="Search Results" width="200">
  <img src="./screenshots/word-detail-2.png" alt="Word Details" width="200">
  <img src="./screenshots/favorites-screen.png" alt="Favorites" width="200">
</div>

<div align="center">
  <img src="./screenshots/profile-selection.png" alt="Profile Selection" width="200">
  <img src="./screenshots/achievements.png" alt="Achievements" width="200">
  <img src="./screenshots/learning-center.png" alt="Learning Center" width="200">
  <img src="./screenshots/settings-screen.png" alt="Settings" width="200">
</div>

---

## 🎬 Demo Videos

### Quick Tour
![App Tour](./screenshots/app-tour.gif)
*A quick tour through Kidopedia's main features*

### Learning in Action
![Learning Demo](./screenshots/learning-demo.gif)
*Watch how kids interact with word definitions*

---

## 🔧 Troubleshooting

Having issues with the Android app?

- **"Network request failed" error**: See [NETWORK_FIX.md](./NETWORK_FIX.md) for quick solutions
- **General Android issues**: Check [ANDROID_TROUBLESHOOTING.md](./ANDROID_TROUBLESHOOTING.md) for comprehensive troubleshooting

The app includes a built-in diagnostics tool in Settings → Diagnostics that can identify most common issues.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (for testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/kidopedia.git
   cd kidopedia
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Run on your device**
   - Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - Or press `a` for Android emulator, `i` for iOS simulator

---

## 📱 Download

### Android APK

Download the latest APK from our [Releases page](https://github.com/yourusername/kidopedia/releases) or build it yourself using GitHub Actions.

**Building APK via GitHub Actions:**
1. Fork this repository
2. Add required secrets to your GitHub repository:
   - `EXPO_TOKEN` - Your Expo access token
   - `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
3. Push to `main` branch or manually trigger the workflow
4. Download the APK from the Actions artifacts

### iOS (Coming Soon)
iOS build is in progress. Stay tuned!

---

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) 0.81
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) 6.0
- **UI Components**: Custom components with React Native primitives
- **Icons**: [Lucide React Native](https://lucide.dev/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL + Edge Functions)
- **Local Storage**: Expo SQLite + AsyncStorage
- **Speech**: Expo Speech for text-to-speech
- **Gradients**: Expo Linear Gradient
- **Build Tool**: Expo (SDK 54)

---

## 📂 Project Structure

```
kidopedia/
├── app/                        # Expo Router pages
│   ├── (tabs)/                # Tab navigation screens
│   │   ├── index.tsx         # Home/Search screen
│   │   ├── learn.tsx         # Learning center
│   │   ├── favorites.tsx     # Favorite words
│   │   └── settings.tsx      # App settings
│   ├── word/[id].tsx         # Word detail screen
│   ├── profiles.tsx          # Profile management
│   └── _layout.tsx           # Root layout
├── components/                # Reusable UI components
│   ├── AchievementBadge.tsx
│   ├── CategoryCard.tsx
│   ├── LevelBanner.tsx
│   └── ProgressBar.tsx
├── services/                  # Business logic & API calls
│   ├── databaseService.ts
│   ├── profileService.ts
│   ├── contentFilterService.ts
│   └── avatarService.ts
├── contexts/                  # React Context providers
│   └── ProfileContext.tsx
├── types/                     # TypeScript type definitions
│   ├── dictionary.ts
│   └── profile.ts
├── supabase/                  # Database migrations & edge functions
│   ├── migrations/
│   └── functions/
└── assets/                    # Images, fonts, and static files
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit using conventional commits (`git commit -m 'feat: add amazing feature'`)
5. Push to your branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## 🔧 Troubleshooting

### "Cannot connect to database" Error

**Step 1: Test in Chrome**
Open Chrome on your Android device and visit:
```
https://knvrcozeveutvwallrgf.supabase.co/rest/v1/
```

**Results:**
- ✅ **JSON appears** → **[BROWSER_WORKS_APP_FAILS.md](./BROWSER_WORKS_APP_FAILS.md)** (Rebuild APK needed)
- ❌ **"Site can't be reached"** → Network is blocking Supabase (Switch to mobile data)

**Step 2: Run diagnostics**
In the app, tap "Test Database Connection" for detailed analysis.

**All troubleshooting guides:**
- [BROWSER_WORKS_APP_FAILS.md](./BROWSER_WORKS_APP_FAILS.md) - Browser works, app fails
- [QUICK_START.md](./QUICK_START.md) - Fast solutions
- [NETWORK_FIX.md](./NETWORK_FIX.md) - Complete troubleshooting
- [ERROR_DIAGNOSIS.md](./ERROR_DIAGNOSIS.md) - Understanding the error
- [ANDROID_TROUBLESHOOTING.md](./ANDROID_TROUBLESHOOTING.md) - All Android issues

---

## 🐛 Bug Reports & Feature Requests

Found a bug or have an idea? Please check our [Issues](https://github.com/yourusername/kidopedia/issues) page!

- **Bug Report**: Use the bug report template
- **Feature Request**: Use the feature request template
- **Questions**: Start a [Discussion](https://github.com/yourusername/kidopedia/discussions)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Dictionary data powered by [Free Dictionary API](https://dictionaryapi.dev/)
- Avatar illustrations from [DiceBear Avatars](https://www.dicebear.com/)
- Icons by [Lucide Icons](https://lucide.dev/)
- Built with [Expo](https://expo.dev/) and [React Native](https://reactnative.dev/)
- Database and backend by [Supabase](https://supabase.com/)

---

## 📧 Contact & Support

- **Email**: support@kidopedia.app
- **Twitter**: [@KidopediaApp](https://twitter.com/kidopediaapp)
- **Website**: [kidopedia.app](https://kidopedia.app)

---

<div align="center">

  **Made with ❤️ for curious young minds**

  If you find Kidopedia helpful, please consider giving it a ⭐️ on GitHub!

  [⬆ Back to Top](#-kidopedia)

</div>

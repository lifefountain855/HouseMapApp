# HouseMapApp

A cross-platform app for exploring and annotating house floorplans and property maps. This README provides setup, development, testing, and deployment guidance so contributors and users can get started quickly.

## Features
- View and scroll interactive house maps
- Add, edit, and remove room annotations
- Search properties by address or parcel ID
- Sync changes locally and (optionally) with a backend API
- Export annotated maps as images or JSON

## Tech stack
- React Native (Expo)
- TypeScript (recommended) <!-- - Redux / Context for state management -->
- Jest + React Native Testing Library for tests

> Note: Adjust commands below if this project uses a different stack (plain React Native, Flutter, etc.).

## Prerequisites
- Node.js (LTS)
- npm or yarn
- Expo CLI (if using Expo): `npm install -g expo-cli`
- Android Studio / Xcode for native emulators (optional)
- Expo Go app on mobile for testing 

## Quickstart
1. Clone the repository
   git clone <[repo-url](https://github.com/lifefountain855/HouseMapApp/)>
2. Install dependencies
   `npm install`
   or
   `yarn install`
3. Start the development server
   - With Expo: `expo run start`
   - React Native CLI (Android): `npx react-native run-android`
   - React Native CLI (iOS): `npx react-native run-ios`

## Environment
If the project uses environment variables, create a `.env` file in the project root and add required values (example):

```
API_BASE_URL=https://api.example.com
GOOGLE_MAPS_API_KEY=your_key_here
```

Do not commit secret keys to the repository.


## Building for production
- Expo: `expo build` or `eas build` (if EAS is configured)
- React Native CLI: follow platform-specific build steps

## Project structure (example)
- /src
  - /components        Reusable UI components
  - /screens           Screen components and routes
  - /navigation        App navigation
  - /store             State management (Redux/Context)
  - /assets            Images, icons, fonts
  - /utils             Helpers and utilities

## Contributing
1. Open an issue describing the bug or feature
2. Fork the repo and create a feature branch: `feature/description`
3. Add tests and documentation for new behavior
4. Open a pull request with a clear description of changes

## Troubleshooting
- Metro cache issues: `npx react-native start --reset-cache`
- Android build failures: ensure Android SDK and emulator are up-to-date


## Contact
Project maintainer: Kevin Sapp <kevrgsapp@gmail.com>

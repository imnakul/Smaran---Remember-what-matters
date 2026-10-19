<p align="center">
  <img src="./assets/icon.png" alt="Smaran app icon" width="96" height="96" />
</p>

# Smaran

**Remember what matters, not what is due.**

A quiet place for the thoughts you keep: reminders you cannot miss, lessons you
have learned, blessings you are grateful for, and sayings you live by. Each has
its own space, ready to return when it matters.

Smaran is a free, local-first Android app. Use it offline without an account, or
optionally connect your own Notion workspace for two-way sync.

[Explore Smaran](https://smaran.nakulsrivastava.com) ·
[Features](#features) · [Privacy](#privacy-and-your-data) ·
[Development](#development) · [Report an issue](https://github.com/imnakul/Smaran---Remember-what-matters/issues)

## Five collections, five ways of remembering

A quote is not a chore, and a blessing is not a habit. Smaran keeps them apart,
each with its own tab, colour, and rhythm.

| Collection | What belongs here |
| --- | --- |
| **Remember** | Core thoughts and reminders: call someone, revisit an idea, remember a date. |
| **Learnings** | Daily insights, lessons, and wisdom worth returning to. |
| **Blessings** | Gratitude, small joys, and moments you want to keep. |
| **Sayings** | Quotes, mantras, and words you live by. |
| **Try Doing** | Experiments, habits, and practices you want to try. |

## Features

| Feature | What it does |
| --- | --- |
| **Local-first storage** | Writes thoughts to your device first. Read, write, schedule, and complete them offline. |
| **Optional two-way Notion sync** | Connect each collection to a Notion database and edit on either side. A status indicator shows sync progress; syncing resumes when you reconnect. |
| **Scheduled and repeating thoughts** | Choose a date for a thought or set it to repeat at an interval. |
| **Daily reminder** | Choose a time for one daily nudge. |
| **Android share sheet** | Send text from another app straight into Smaran. |
| **Progress and streaks** | Follow your completion ring and streak, with confetti when you clear the day's list. |
| **Focus mode** | Give one thought the full screen when the list itself becomes a distraction. |
| **PIN lock** | Add a PIN gate to protect the app from casual access. |
| **Privacy screen guard** | Hide the app-switcher preview. On Android, this also blocks screenshots and screen recording while enabled. |
| **Backup and restore** | Export thoughts to a JSON file and import a backup later. |
| **Appearance customization** | Adjust typography, colours, wallpaper, card shapes, spacing, navigation, and light or dark mode. |

## Make it yours

- Seven typefaces.
- Six note colours, plus a custom colour picker.
- Wallpaper backgrounds and dimming.
- Adjustable card corners and edge treatments.
- Card density, spacing, and appearance choices.
- Four bottom navigation styles.
- Light and dark themes.

Explore the [interactive preview on the website](https://smaran.nakulsrivastava.com)
to try the visual direction before opening the app.

## Privacy and your data

Smaran has no account system or app backend. Thoughts are stored on your phone.
Notion sync is optional: if you enable it, a copy also lives in the Notion
databases you choose, under your own Notion account.

- **Offline use:** the core app works without an internet connection or Notion.
- **Notion credentials:** the integration token is kept in the device's secure
  store and used to communicate with Notion.
- **PIN protection:** the PIN is an app-access gate, not a claim that all stored
  thoughts are encrypted. Use your device's screen lock as well.
- **Portable backups:** exported JSON contains your thoughts as readable text.
  Store and share backup files with the same care as the original content.
- **Your choice to sync:** disconnecting Notion stops synchronization; it leaves
  local thoughts and existing Notion pages in place.

## Optional Notion setup

1. Open Smaran's settings and choose **Notion sync**.
2. Create an internal integration in your own Notion workspace and connect it to
   the page or databases you want Smaran to use.
3. Paste the integration token into Smaran.
4. Link each collection to an existing database, or let Smaran create the five
   collection databases inside a page you select.
5. Check the sync status, then capture and edit thoughts in Smaran or Notion.

Skip this setup to keep using Smaran entirely offline. Never put an integration
token in a GitHub issue, screenshot, or commit.

## Availability

Android is the current supported platform. Visit the
[Smaran website](https://smaran.nakulsrivastava.com) for product information and
availability updates.

An iOS build is on the roadmap. The Android share-sheet integration is currently
Android-only; the existence of an iOS development command does not mean an iOS
release is available.

## Development

The repository contains the Expo mobile app at the root and a separate Next.js
marketing site in [`landing-page/`](./landing-page).

### Mobile app

Built with Expo SDK 57, React Native, TypeScript, Expo Router, and NativeWind.
Use npm with the committed `package-lock.json`.

```bash
git clone https://github.com/imnakul/Smaran---Remember-what-matters.git
cd Smaran---Remember-what-matters
npm ci
npm run android
```

Building Android locally requires an Android SDK, a compatible JDK, and a device
or emulator. Follow the [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/)
for environment requirements. The app uses native integrations, including
`expo-share-intent`, so use a native development build for full functionality.

| Command | Purpose |
| --- | --- |
| `npm start` | Start the Expo development server. |
| `npm run android` | Build and run the Android app locally. |
| `npm run ios` | Build and run on iOS for development; requires macOS and Xcode. |
| `npm run web` | Start a web preview; native-only integrations need a device build. |

### Marketing site

The website has its own npm lockfile and dependencies.

```bash
cd landing-page
npm ci
npm run dev
```

Its package also provides `npm run lint`, `npm run build`, and `npm start`.

### Repository map

| Path | Responsibility |
| --- | --- |
| `app/` | Expo Router entry points and app composition. |
| `src/components/` | Thought cards, collections, settings, focus, PIN, and sync interfaces. |
| `src/context/` | Settings, connectivity, lock, and synchronization state. |
| `src/hooks/` | Thought management, selected dates, gestures, and appearance. |
| `src/lib/` | Local storage, scheduling, reminders, backups, PIN handling, and Notion integration. |
| `src/constants/` | Appearance, typefaces, themes, and presets. |
| `landing-page/` | Next.js product website. |

## Contributing

Read [`AGENTS.md`](./AGENTS.md) before changing the app. Keep contributions focused
and preserve offline use, optional sync, and the existing privacy controls. Use
synthetic thoughts when reporting issues or sharing screenshots; keep personal
content and Notion credentials out of the repository.

## License

This repository includes the [MIT License](./LICENSE).

---

*Smaran* is Sanskrit for remembrance: holding something in mind and returning to
it, rather than merely storing it.

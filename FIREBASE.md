# Firebase setup

The app runs with **no** configuration: it creates local accounts on the device.
Firebase is optional and changes three things — sign-in provider, Google sign-in,
and where posts are stored.

Nothing below breaks the app if you skip it.

---

## Read this first: you do not edit Gradle files

Firebase's Android docs tell you to add the Google services plugin to
`build.gradle.kts` and add the Firebase BoM to your dependencies. **That is for a
native Android project. This one is generated.**

`android/` is produced by `npx expo prebuild` from `app.json` and `app.config.js`.
Anything you type in there is overwritten the next time prebuild runs.

Expo already does the Gradle work for you. `@expo/config-plugins` ships
`GoogleServices.js`, which — when `expo.android.googleServicesFile` is set — will:

1. copy your `google-services.json` into `android/app/`,
2. add `classpath 'com.google.gms:google-services:4.4.1'` to the project build file,
3. append `apply plugin: 'com.google.gms.google-services'` to the app build file.

It only does this for **Groovy** Gradle files. This project is Groovy, so it works
as-is.

`app.config.js` sets `googleServicesFile` **only when the file exists**, so a
checkout without Firebase still prebuilds.

### Do I need the Firebase BoM and firebase-analytics?

No. Those are the *native* Firebase SDK (Kotlin/Java). This app uses the
**JavaScript** Firebase SDK (`firebase` in `package.json`), which Metro bundles —
it never goes through Gradle. Adding the BoM would fatten the APK and do nothing.

The one thing that genuinely needs the native side is **Google Sign-In**, because
`@react-native-google-signin/google-signin` reads the OAuth client that
`google-services.json` injects.

### What each piece is actually for

| Piece | Needed for | Needed for email/password? |
|---|---|---|
| `EXPO_PUBLIC_FIREBASE_*` env vars | All Firebase features | **Yes** |
| `google-services.json` + Gradle plugin | Google Sign-In on Android | No |
| SHA-1 fingerprint | Google Sign-In on Android | No |

So you can test Firebase email/password today with just the six env vars. The
JSON file and fingerprint are only for the Google button.

---

## 1. Create the project

<https://console.firebase.google.com> → **Add project**. Analytics optional.

## 2. Register the **Android** app

Project settings → **Your apps** → **Add app** → **Android**.

The package name must match `app.json` → `expo.android.package`, which is
currently:

```
com.anonymous.nutrition_coach_new
```

> If you registered only a **Web** app, the fingerprint field does not exist.
> That is why you could not find it — fingerprints live on the Android app card,
> and only after the Android app exists.

## 3. Add the SHA-1 fingerprint

This is the step Google Sign-In dies without. The message you get is
`DEVELOPER_ERROR` (status 10), which never mentions fingerprints.

Your project already has the standard React Native debug keystore, and its
fingerprint is:

```
5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
```

Prints it again any time:

```bash
npm run android:sha1
```

Then Firebase → Project settings → Your apps → your **Android** app →
**Add fingerprint** → paste.

> Two caveats. First, `expo prebuild --clean` deletes `android/`, and the keystore
> is recreated — this particular file is the standard RN one, so the SHA-1 is
> stable, but check with `npm run android:sha1` after any clean. Second, if you
> build with **EAS**, the build server uses its own keystore: run
> `eas credentials --platform android` and register the SHA-1 it shows instead.

## 4. Download `google-services.json`

Same screen → download → put it in the **project root**, next to `app.json`.

`app.config.js` picks it up automatically.

## 5. Enable the sign-in providers

Authentication → **Get started** → **Sign-in method**:

- **Email/Password** → Enable.
- **Google** → Enable. Under *Web SDK configuration*, copy the **Web client ID**.
  That is `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.

## 6. Create `.env` in the project root

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=1:...:android:...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...apps.googleusercontent.com
```

All values are on the same Project settings page, or inside
`google-services.json`.

`EXPO_PUBLIC_*` is inlined at **build time**. After editing `.env`:

```bash
npx expo start --clear
```

## 7. Prebuild and run

Adding `google-services.json` changes native config, so a JS reload is not
enough:

```bash
npx expo prebuild --platform android
npx expo run:android
```

`expo run:android` only prebuilds when `android/` is missing, which is why the
explicit `prebuild` line is there.

## 8. Renaming the package

Decide before registering the Android app in Firebase. Changing it later means a
second Firebase app and a fresh `google-services.json`.

Edit `app.json` → `expo.android.package`, prebuild again, and re-register the
fingerprint if the keystore changed.

---

## What changes when Firebase is configured

| | Local mode (default) | Firebase mode |
|---|---|---|
| Accounts | On the device, salted hash | Firebase Auth |
| Session | AsyncStorage | Firebase + AsyncStorage persistence |
| Google sign-in | Hidden | Shown, if configured |
| Community posts | On the device | Firestore |
| Data leaves device | Never | Auth metadata, profile, posts |

## Why Firebase is pinned to 10.14

`firebase` is pinned to `^10.14.1` deliberately. Later majors removed
`getReactNativePersistence`, which is the only supported way to make an auth
session survive an app restart on a device. Firebase 13 does not export it at
all, and `getAuth()` on React Native falls back to in-memory storage — every
launch signs the user out.

On Metro, `firebase/auth` re-exports `@firebase/auth`, and that package has a
`react-native` export condition pointing at a build which *does* include the
helper. That is why the import works on device and not under a plain Node
`require`, and why ESLint needs a disable comment on that one line.

Auth is initialised per platform:

| Platform | File | Persistence |
|---|---|---|
| iOS / Android | `services/auth/authPersistence.native.js` | AsyncStorage via `getReactNativePersistence` |
| Web | `services/auth/authPersistence.web.js` | IndexedDB via `getAuth` |

### Never hand-write a persistence object

`initializeAuth` runs every entry through Firebase's internal registry and
asserts it is a real registered instance. A plain object with the right methods
fails that assertion with:

```
INTERNAL ASSERTION FAILED: Expected a class definition
  at _getInstance … at _initializeAuthInstance
```

That crash happens at startup on every platform, not just web. Use the SDK's own
factory, or `getAuth`.

## Known limits

**Email and password work offline** once signed in — Firebase caches the session.
Creating an account or signing in needs a network.

**Google sign-in needs a development build.** It is a native module; Expo Go
cannot load it. The button is hidden rather than shown-and-broken, and the email
form always works.

**Sessions survive restarts.** Firebase 13 removed `getReactNativePersistence`,
so `src/services/auth/persistence.js` supplies the AsyncStorage-backed provider
the SDK expects. Without it every launch signs the user out.

**Phone (OTP) sign-in is not wired up.** It needs `@react-native-firebase/auth`
and Play Integrity — a larger native change than this build carries.

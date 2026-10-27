# Features

What the app does, and what each capability depends on. "Local" means it works
with no network and no configuration.

## Logging

| Feature | Where | Depends on |
|---|---|---|
| Local accounts | `screens/auth/*` | — |
| Firebase accounts | `services/auth/firebaseAuth.js` | `EXPO_PUBLIC_FIREBASE_*` |
| Food diary, per-day browse | `screens/DiaryScreen` | — |
| Add food, sentence parser, custom foods | `screens/MealEntryScreen` | — |
| Catalogue search, favourites | `screens/FoodSearchScreen` | — |
| **Household portions** (katori, bowl, plate, piece, roti) | `utils/portions.js` | — |
| **Barcode scan** | `screens/BarcodeScanScreen` | Open Food Facts (free, no key) |
| **Read a nutrition label** into a food record | `screens/LabelEntryScreen` | — |
| **Photo estimate**, labelled as an estimate | `screens/FoodRecognitionScreen` | `EXPO_PUBLIC_API_BASE_URL` |
| Water | `components/WaterTrackerCard` | — |
| **Eating window** derived from the log | `utils/fasting.js` | — |

## Meal Memory

| Feature | Where | Depends on |
|---|---|---|
| **Save a logged day-part as a reusable meal** | Diary → star icon per meal section | — |
| **One-tap repeat** of saved meals and recently eaten meals | Add food screen | — |
| Units respected when repeating (same items, same portions) | `utils/mealTemplates.js` | — |

A template stores the exact items, portions and quantities you logged — not a
catalogue entry — so repeating reproduces the same numbers. Nothing leaves the
device.

## Personal insights

| Feature | Where | Depends on |
|---|---|---|
| **Recurring nutrient gaps** with the arithmetic shown | `screens/InsightsScreen` | 3+ logged days |
| Protein consistency, weekday vs weekend, logging consistency | same | — |
| Catalogue suggestions for the nutrient that is short | same | — |
| Window selector (14 / 30 days) | same | — |

Every insight states how many days it examined and how many were short. Low
recorded intake is not a deficiency, and the screen says so.

## Nutrition

| Feature | Where | Depends on |
|---|---|---|
| Macros and calories | every screen | — |
| **Micronutrients** — 12 tracked, incl. iron, calcium, B12, folate, vitamin D | `screens/NutrientsScreen` | — |
| **Indian reference intakes** (ICMR-NIN 2020) | `data/indianRda.js` | — |
| **105 Indian dishes** in household measures | `data/indianDishes*.js` | — |
| **174 foods total** in the shipped catalogue | `data/foods.js`, dishes | — |
| **Dataset import** — CSV/JSON, for INDB, IFCT or your own spreadsheet | `screens/DataScreen` | — |
| Diet markers (veg, vegan, eggetarian, non-veg, jain) | food data | — |
| **Daily health score** with a visible breakdown | `utils/score.js` | — |

## AI (bring your own key)

| Feature | Where | Depends on |
|---|---|---|
| **Photo analysis with a vision model** | `services/aiProvider.js` | your OpenRouter / OpenAI / compatible key |
| **Grounded coach chat** | `services/aiProvider.js` | same key |
| **Catalogue retrieval** for grounding (the "R" in RAG) | `utils/retrieval.js` | — |
| Key entry, free-model picker, connection test | `screens/SettingsScreen` | — |
| Server fallback | `services/nutritionApi.js` | `EXPO_PUBLIC_API_BASE_URL` |

The model identifies food and chooses from a catalogue it is shown; calories and
macros are always computed here from our own rows. A model asked "how many
calories is this?" will answer confidently and wrongly — one asked "which of
these rows is it, and roughly how many katori?" is doing a job it can do.

OpenRouter serves free models, so this costs the user nothing but a signup. No
key ships in the build.

## Targets and progress

| Feature | Where | Depends on |
|---|---|---|
| Manual calorie and macro targets | `screens/SettingsScreen` | — |
| **Adaptive energy expenditure** from intake and weight trend | `utils/expenditure.js` | 10+ days of paired logs |
| Weight, sleep, steps | `screens/StatsScreen` | — |
| Steps from the pedometer | `components/fitness/StepCounter` | device sensor |
| **Health Connect status and permission flow** | `services/healthConnect.js` | native module (see README) |
| Goals with derived progress | `screens/GoalsScreen` | — |
| 7/30-day charts, streaks | `screens/StatsScreen`, `TodayScreen` | — |

## Recipes and planning

| Feature | Where | Depends on |
|---|---|---|
| Recipe catalogue, detail, log-to-diary | `screens/RecipesScreen` | — |
| **Recipe import from a URL** (schema.org JSON-LD) | `screens/RecipeImportScreen` | network |
| Deterministic 7-day meal plan | `screens/MealPlanningScreen` | — |
| Recipe rewriting | `screens/RecipeCustomizationScreen` | `EXPO_PUBLIC_API_BASE_URL` |

## Training

| Feature | Where | Depends on |
|---|---|---|
| Workout catalogue | `screens/WorkoutsScreen` | — |
| **Set-level logging with a "last time" panel** | `screens/WorkoutDetailScreen` | — |
| Training volume in history | `screens/WorkoutsScreen` | — |

## Data and account

| Feature | Where | Depends on |
|---|---|---|
| **Export** — JSON backup or per-day CSV | `screens/DataScreen` | share sheet (falls back to a copyable box) |
| **Restore** from a JSON backup, version-checked | `screens/DataScreen` | — |
| **Schema migration** v1 → v2 | `redux/migrations.js` | — |
| Personal challenges, posts, comments | `screens/CommunityScreen` | — |
| Local reminders | `screens/NotificationsScreen` | notification permission |
| **Configurable Today screen** | `screens/SettingsScreen` | — |
| Profile, targets, katori size, diet | `screens/SettingsScreen` | — |

## Database licences

The app ships **its own** catalogue, written for this project. It does not ship
INDB (1,014 Indian recipes) or IFCT 2017, because their redistribution terms are
not confirmed. Both are usable through **dataset import** the moment you hold a
licensed copy — paste the CSV or JSON and the rows become foods.

## On-device models

LFM2.5-230M is a **text** model: it cannot read a photo. Vision is a separate
family (LFM2.5-VL-450M, SigLIP2 encoder). Practical runtime would be
`llama.rn` with a GGUF build, which needs a development build and roughly
150–200 MB at Q4.

Where it would genuinely help: an offline coach, and better free-text parsing
than the deterministic matcher. Where it would not: anything that needs to see
food, and anything that reports nutrition numbers it did not get from data.

## Not built

| Feature | Reason |
|---|---|
| OAuth sign-in | Needs a native OAuth flow and a Firebase client ID; email and password work |
| On-device LLM | Large effort; two-tier product on India's device distribution |
| Coach marketplace / social groups | An operations business, not a feature |
| Nutrition-label OCR | Needs a server. The guided label form covers the same job without one |

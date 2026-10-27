// Support content. Answers describe what this app actually does — including the
// parts that need a configured server. No invented support hours.

/** @type {import('../types').FaqEntry[]} */
export const FAQ = [
  {
    id: 'q-getting-started',
    category: 'Getting started',
    question: 'Do I need an account to use the app?',
    answer:
      'Yes, but it can be a local account. Creating a local account stores your profile on this device only — no email is sent and nothing leaves the phone. If the build has Firebase configured, you can use the same email and password there instead and your profile syncs.',
  },
  {
    id: 'q-local-vs-firebase',
    category: 'Getting started',
    question: 'How do I know which account type I am using?',
    answer:
      'Settings shows it under Account. Local means everything is stored on this device. Firebase means your profile and social posts are stored in the configured Firebase project.',
  },
  {
    id: 'q-first-targets',
    category: 'Getting started',
    question: 'Where do the starting calorie and macro targets come from?',
    answer:
      'They are fixed defaults: 2,000 kcal, 80 g protein, 200 g carbohydrate, 60 g fat and 2,000 ml water. They are not calculated from your body. Change them in Settings → Targets to something you have reason to believe.',
  },
  {
    id: 'q-log-food',
    category: 'Logging',
    question: 'How do I log a meal?',
    answer:
      'Open Diary, choose a meal section, and add food from the catalogue. You can search by name or type a sentence like "2 eggs and a coffee" and the parser will match it against the catalogue.',
  },
  {
    id: 'q-custom-food',
    category: 'Logging',
    question: 'A food I eat is not in the catalogue. What now?',
    answer:
      'Add it as a custom entry: the name, the portion and the four numbers from the packet. Custom entries are saved on the device and appear in search from then on.',
  },
  {
    id: 'q-water-units',
    category: 'Logging',
    question: 'Why is water shown in millilitres and glasses?',
    answer:
      'Water is stored in millilitres because that is what bottles and targets are labelled in. The diary shows it as 250 ml glasses because that is easier to count. One glass is 250 ml.',
  },
  {
    id: 'q-history',
    category: 'Data',
    question: 'What happens at midnight?',
    answer:
      'The first time you open the app on a new day, yesterday is closed and written into your history, and today starts empty. Nothing you logged is deleted — it moves into the history that the Progress charts read.',
  },
  {
    id: 'q-history-empty',
    category: 'Data',
    question: 'Why are my charts empty?',
    answer:
      'Charts are drawn from days that have at least one logged item. A day with no food or water is not written into history, so a new account has nothing to plot until the second day of logging.',
  },
  {
    id: 'q-export',
    category: 'Data',
    question: 'Can I export or delete my data?',
    answer:
      'Deleting your account in Settings removes the local profile and everything stored with it. There is no export yet. If you are on a Firebase account, deleting the local profile does not delete the Firebase record.',
  },
  {
    id: 'q-recognition',
    category: 'Recognition and coaching',
    question: 'Why does the Scan tab say it is not connected?',
    answer:
      'Photo recognition runs on a server, not on the phone. This build has no analysis endpoint configured, so the tab tells you that instead of guessing at your meal. Set EXPO_PUBLIC_API_BASE_URL to a server implementing /api/recognize to enable it.',
  },
  {
    id: 'q-coach',
    category: 'Recognition and coaching',
    question: 'Why is the nutritionist chat unavailable?',
    answer:
      'The coach is a language model behind your own server. Without a configured endpoint there is nothing to talk to, so the tab is disabled rather than answering with canned text.',
  },
  {
    id: 'q-reminders',
    category: 'Notifications',
    question: 'Do reminders work if the app is closed?',
    answer:
      'Yes, if you allow notifications. Reminders are scheduled with the operating system, so they fire even when the app is closed. If permission is denied, the app tells you and the reminder times stay saved but silent.',
  },
  {
    id: 'q-social-local',
    category: 'Community',
    question: 'Who can see my posts?',
    answer:
      'On a local account, nobody — the feed is a journal on your device. On a Firebase account, posts are written to the configured project, so anyone with access to that project can read them.',
  },
  {
    id: 'q-contact',
    category: 'Support',
    question: 'Something is broken. Who do I tell?',
    answer:
      'This build has no support inbox wired up. If you are running it from source, open an issue in the project repository and include the screen, what you expected and what happened.',
  },
];

export const FAQ_CATEGORIES = ['Getting started', 'Logging', 'Data', 'Recognition and coaching', 'Notifications', 'Community', 'Support'];

export default FAQ;

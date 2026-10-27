// Plain-language terms and privacy text. This is not a legal document drafted by
// a lawyer; it is an accurate description of what the software does with data.

export const TERMS = `Using this app
This is a nutrition and activity tracker. It is provided as-is, without warranty, and it does not give medical advice. Calorie and macro targets are numbers you set; they are not a prescription. If you have a medical condition, are pregnant, or are managing an eating disorder, speak to a clinician before using intake targets.

Estimates, not measurements
Food values in the catalogue are typical values for the stated portion. They are not laboratory measurements of what you ate. Exercise calorie estimates are estimates for an average adult at the stated duration and will not match your body exactly. Treat every number here as a record of what you chose to log, not a clinical measurement.

What you enter is yours
You keep whatever you log. The app does not claim any licence over it.

Availability
Features that depend on a server — photo recognition and the nutritionist chat — are only available when this build has an endpoint configured. When they are unavailable the app says so rather than producing a guess.

Changes
If the behaviour of the app changes in a way that affects these terms, the text in this screen changes with it.`;

export const PRIVACY = `What is stored on your device
Your profile, account credentials (as a salted hash, never the password itself), food and water logs, history, goals, workouts, meal plans, saved recipes, saved posts, chat messages and settings are stored in this app's local storage on your phone. They are not uploaded anywhere unless the build is configured to use a server or Firebase.

What leaves your device
Nothing, on a local account, with two exceptions that only run if you explicitly use them:
- Photo recognition sends the image you select to the server address configured in this build.
- The nutritionist chat sends your message and the last few messages of context to the same server.

If this build is configured with Firebase, your profile and any community posts are stored in that Firebase project, which is operated by whoever configured the build. Firebase also receives standard authentication metadata.

What is never collected
No advertising identifiers, no location, no contacts, no background analytics, no third-party tracking libraries.

Deleting your data
Settings → Account → Delete account removes the local profile and everything stored with it. On a Firebase account, you additionally need to remove the record from the Firebase project; deleting the local profile does not do that.

Permissions
Camera and photo library are used only when you choose a photo to analyse. Notifications are used only for the reminder times you set. Motion and fitness data is read only to count steps, and only while you have step tracking enabled.`;

export default { TERMS, PRIVACY };

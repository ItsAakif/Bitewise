/* eslint-env node */
// Continuous native generation config.
//
// app.json stays the source of truth for everything static; this file only adds
// the Firebase native config files when they are actually present. Referencing a
// missing google-services.json in app.json would break `expo prebuild` for anyone
// who has not set Firebase up yet — which is everybody by default.

const fs = require('fs');
const path = require('path');

const base = require('./app.json');

const exists = (file) => {
  try {
    return fs.existsSync(path.join(__dirname, file));
  } catch {
    return false;
  }
};

module.exports = () => {
  const config = { ...base.expo };

  if (exists('google-services.json')) {
    config.android = { ...config.android, googleServicesFile: './google-services.json' };
  }
  if (exists('GoogleService-Info.plist')) {
    config.ios = { ...config.ios, googleServicesFile: './GoogleService-Info.plist' };
  }

  return config;
};

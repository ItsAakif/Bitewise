// Provider configuration. Deliberately free of React Native and Expo imports so
// it can be unit-tested in plain Node — the empty-string bug that made a saved
// key look like "no model configured" lived here and went unnoticed precisely
// because this logic was tangled up with native modules.

export const PROVIDERS = {
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    keyHint: 'Create a free key at openrouter.ai/keys',
  },
  openai: {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    keyHint: 'platform.openai.com/api-keys',
  },
  custom: {
    id: 'custom',
    label: 'Custom (OpenAI-compatible)',
    baseUrl: '',
    keyHint: 'Any endpoint that accepts /chat/completions',
  },
};

export const DEFAULT_SETTINGS = {
  provider: 'openrouter',
  apiKey: '',
  baseUrl: '',
  visionModel: 'google/gemini-2.0-flash-exp:free',
  chatModel: 'meta-llama/llama-3.3-70b-instruct:free',
};

const text = (value) => (typeof value === 'string' ? value.trim() : '');

/**
 * Resolves stored settings into a usable config.
 *
 * Empty strings must not override the defaults: the slice initialises every
 * field to '', so `{ ...DEFAULT_SETTINGS, ...ai }` made "key pasted, model not
 * chosen" read as "no model configured".
 */
export function readConfig(ai) {
  const source = ai || {};
  const field = (key) => text(source[key]) || DEFAULT_SETTINGS[key];

  const providerId = PROVIDERS[text(source.provider)] ? text(source.provider) : DEFAULT_SETTINGS.provider;
  const provider = PROVIDERS[providerId];

  const settings = {
    provider: providerId,
    apiKey: text(source.apiKey),
    baseUrl: text(source.baseUrl),
    visionModel: field('visionModel'),
    chatModel: field('chatModel'),
  };

  const baseUrl = (settings.baseUrl || provider.baseUrl || '').replace(/\/$/, '');

  return {
    ...settings,
    providerId: provider.id,
    providerLabel: provider.label,
    baseUrl,
    ready: Boolean(settings.apiKey && baseUrl && settings.visionModel),
    chatReady: Boolean(settings.apiKey && baseUrl && settings.chatModel),
  };
}

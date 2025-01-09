export const ENV_VARIABLES = {
  REQUIRED: [
    'METAMASK_PASSWORD',
    'SEED_PHRASE',
    'APPLITOOLS_API_KEY',
  ],
  OPTIONAL: [
    'METAMASK_VERSION',
    'LOCAL_RUN',
    'USE_APPLITOOLS',
  ],
} as const;
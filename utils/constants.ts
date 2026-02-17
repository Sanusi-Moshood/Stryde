export const APP_IDENTITY = {
  name: 'Stryde',
  uri: 'https://olawale.dev',
  icon: 'favicon.ico', // Relative to uri
};
export const RPC_ENDPOINT = 'https://api.devnet.solana.com';
export const CLUSTER = 'solana:devnet' as const;
// Alternative endpoints for production
export const MAINNET_RPC = 'https://api.mainnet-beta.solana.com';
export const MAINNET_CLUSTER = 'solana:mainnet' as const;

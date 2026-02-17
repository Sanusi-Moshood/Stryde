import type { Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { APP_IDENTITY } from '@/utils/constants';
import { toByteArray } from 'react-native-quick-base64';
export async function connectWallet() {
  // This is where you integrate Mobile Wallet Adapter
  // For now, returning mock data

  try {
    const {
      transact,
    } = require('@solana-mobile/mobile-wallet-adapter-protocol-web3js');
    const { PublicKey } = require('@solana/web3.js');

    const result = await transact(async (wallet: Web3MobileWallet) => {
      const authResult = await wallet.authorize({
        identity: APP_IDENTITY,
        chain: 'solana:devnet',
      });

      // authResult.accounts contains the authorized accounts
      // addresses are base64-encoded
      const firstAccount = authResult.accounts[0];
      const publicKey = new PublicKey(toByteArray(firstAccount.address));

      console.log(`publicKey ${publicKey}`);
      console.log(`✅ publicKey: ${publicKey.toBase58()}`);
      return {
        publicKey: publicKey.toBase58(),
        authToken: authResult.auth_token,
      };
    });

    console.log(`result ${result}`);

    return result;
  } catch (error) {
    console.error('Mobile Wallet Adapter error:', error);
    throw error;
  }
}

export async function disconnectWallet(authToken: string) {
  // Handle wallet disconnection
  const {
    transact,
  } = require('@solana-mobile/mobile-wallet-adapter-protocol-web3js');
  await transact(async (wallet: Web3MobileWallet) => {
    await wallet.deauthorize({ auth_token: authToken });
  });
  return true;
}

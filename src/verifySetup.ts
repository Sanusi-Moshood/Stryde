// src/utils/verifySetup.ts
import { Keypair } from '@solana/web3.js';

export function verifyPolyfills(): boolean {
  try {
    // Test 1: crypto.getRandomValues must work
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);

    // Test 2: Keypair generation must work
    const keypair = Keypair.generate();
    console.log('✓ Test keypair generated:', keypair.publicKey.toBase58());

    // Test 3: Buffer must work
    const buffer = Buffer.from('test', 'utf-8');
    console.log('✓ Buffer working:', buffer.toString('hex'));

    // Test 4: TextEncoder must work
    const encoded = new TextEncoder().encode('test');
    console.log('✓ TextEncoder working:', encoded.length, 'bytes');

    return true;
  } catch (error) {
    console.error('Polyfill verification failed:', error);
    return false;
  }
}

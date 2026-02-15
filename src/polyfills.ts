// src/polyfills.ts
import 'react-native-get-random-values';
import { Buffer } from 'buffer';

(global as any).Buffer = Buffer;

console.log('✅ Polyfills loaded');

import { createContext } from 'react';
export const BitcoinWalletContext = createContext({
    isSupported: false,
    isEnabled: true
});

import { createContext } from 'react';
import {BitcoinWallet} from "../wallet/BitcoinWallet";

export const BitcoinWalletContext: React.Context<{
    bitcoinWallet: BitcoinWallet,
    setBitcoinWallet: (wallet: BitcoinWallet) => void
}> = createContext({
    bitcoinWallet: null,
    setBitcoinWallet: null
});

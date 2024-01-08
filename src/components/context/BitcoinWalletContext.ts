
import { createContext } from 'react';
import {ISwap} from "sollightning-sdk";
import * as BN from "bn.js";

export const BitcoinWalletContext: React.Context<{
    isSupported: boolean,
    isEnabled: boolean,
    wallet?: {
        getAddress: () => Promise<string>,
        getBalance: () => Promise<BN>;
        sendTransaction: (recipient: string, amount: BN) => Promise<string>,
        signTransaction: (recipient: string, amount: BN) => Promise<string>
    }
}> = createContext({
    isSupported: false,
    isEnabled: true
});
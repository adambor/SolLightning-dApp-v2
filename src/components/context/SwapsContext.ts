
import { createContext } from 'react';
import {ISwap, SolanaSwapper} from "sollightning-sdk";

export const SwapsContext: React.Context<{
    actionableSwaps: ISwap[],
    removeSwap: (swap: ISwap) => void,
    swapper: SolanaSwapper,
    walletType: "real" | "fake" | "loading"
}> = createContext({
    actionableSwaps: [],
    removeSwap: null,
    swapper: null,
    walletType: "loading"
});
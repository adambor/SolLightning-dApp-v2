
import { createContext } from 'react';
import {ISwap} from "sollightning-sdk";

export const SwapsContext: React.Context<{
    actionableSwaps: ISwap[],
    removeSwap: (swap: ISwap) => void
}> = createContext({
    actionableSwaps: [],
    removeSwap: null
});
import { createContext } from 'react';
export const SwapsContext = createContext({
    actionableSwaps: [],
    removeSwap: null,
    swapper: null,
    walletType: "loading"
});

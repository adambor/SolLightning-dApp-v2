import { createContext } from 'react';
import {BitcoinWallet} from "../wallet/BitcoinWallet";
import {WebLNProvider} from "webln";

export const WebLNContext: React.Context<{
    lnWallet: WebLNProvider,
    setLnWallet: (wallet: WebLNProvider) => void
}> = createContext({
    lnWallet: null,
    setLnWallet: null
});

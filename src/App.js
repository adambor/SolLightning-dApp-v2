import { jsx as _jsx } from "react/jsx-runtime";
import './App.css';
import * as React from "react";
import WalletTab from "./components/WalletTab";
//import WrappedApp from "./WrappedApp";
import { QuickScanScreen } from "./components/quickscan/QuickScanScreen";
import { Step2Screen } from "./components/quickscan/Step2Screen";
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { createSwapperOptions, SolanaSwapper } from "sollightning-sdk/dist";
import { AnchorProvider } from "@coral-xyz/anchor";
import { FEConstants } from "./FEConstants";
import { SwapTab } from "./components/SwapTab2";
import { smartChainCurrencies } from "./utils/Currencies";
require('@solana/wallet-adapter-react-ui/styles.css');
function WrappedApp() {
    const wallet = useAnchorWallet();
    const { connection } = useConnection();
    const [provider, setProvider] = React.useState();
    const [swapper, setSwapper] = React.useState();
    React.useEffect(() => {
        if (wallet == null) {
            setSwapper(null);
            setProvider(null);
            return;
        }
        const _provider = new AnchorProvider(connection, wallet, { preflightCommitment: "processed" });
        console.log("New signer set: ", wallet.publicKey);
        setProvider(_provider);
        (async () => {
            try {
                console.log("init start");
                const swapper = new SolanaSwapper(_provider, createSwapperOptions(FEConstants.chain));
                await swapper.init();
                console.log("Swapper initialized, getting claimable swaps...");
                //
                // setClaimableBTCLNtoEVM(await swapper.getClaimableSwaps());
                //
                // setRefundableEVMtoBTCLN(await swapper.getRefundableSwaps());
                setSwapper(swapper);
                console.log("Initialized");
            }
            catch (e) {
                console.error(e);
            }
        })();
    }, [wallet]);
    const [scannedData, setScannedData] = React.useState();
    return (_jsx(SwapTab, { swapper: swapper, supportedCurrencies: smartChainCurrencies }));
    if (scannedData == null)
        return (_jsx(QuickScanScreen, { onScanned: setScannedData }));
    return (_jsx(Step2Screen, { address: scannedData, swapper: swapper }));
}
function App() {
    return (_jsx("div", Object.assign({ className: "App d-flex flex-column" }, { children: _jsx(WalletTab, { children: _jsx(WrappedApp, {}) }) })));
}
export default App;

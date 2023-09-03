import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
import { SwapTab } from "./components/swap/SwapTab2";
import { smartChainCurrencies } from "./utils/Currencies";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SwapsContext } from "./components/context/SwapsContext";
import { HistoryScreen } from "./components/history/HistoryScreen";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Container, Navbar, Spinner } from "react-bootstrap";
require('@solana/wallet-adapter-react-ui/styles.css');
function WrappedApp() {
    const wallet = useAnchorWallet();
    const { connection } = useConnection();
    const [provider, setProvider] = React.useState();
    const [swapper, setSwapper] = React.useState();
    const [actionableSwaps, setActionableSwaps] = React.useState([]);
    React.useEffect(() => {
        if (wallet == null) {
            setSwapper(null);
            setProvider(null);
            setActionableSwaps([]);
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
                const actionableSwaps = (await swapper.getActionableSwaps());
                console.log("actionable swaps: ", actionableSwaps);
                setActionableSwaps(actionableSwaps);
                setSwapper(swapper);
                console.log("Initialized");
            }
            catch (e) {
                console.error(e);
            }
        })();
    }, [wallet]);
    return (_jsxs(_Fragment, { children: [_jsx(Navbar, Object.assign({ bg: "dark", variant: "dark" }, { children: _jsxs(Container, { children: [_jsx(Navbar.Brand, Object.assign({ href: "#home", className: "fw-semibold" }, { children: "SolLightning" })), swapper != null ? (_jsx("div", Object.assign({ className: "ms-auto" }, { children: _jsx(WalletMultiButton, {}) }))) : ""] }) })), _jsx(SwapsContext.Provider, Object.assign({ value: {
                    actionableSwaps,
                    removeSwap: (swap) => {
                        setActionableSwaps((val) => {
                            const cpy = [...val];
                            const i = cpy.indexOf(swap);
                            if (i >= 0)
                                cpy.splice(i, 1);
                            return cpy;
                        });
                    }
                } }, { children: _jsxs("div", Object.assign({ className: "d-flex flex-grow-1 flex-column" }, { children: [swapper == null ? (_jsx("div", Object.assign({ className: "no-wallet-overlay d-flex align-items-center" }, { children: _jsx("div", Object.assign({ className: "mt-auto height-50 d-flex justify-content-center align-items-center flex-fill" }, { children: _jsx("div", Object.assign({ className: "text-white text-center" }, { children: provider != null && swapper == null ? (_jsxs(_Fragment, { children: [_jsx(Spinner, {}), _jsx("h4", { children: "Connecting to SolLightning network..." })] })) : (_jsxs(_Fragment, { children: [_jsx(WalletMultiButton, {}), _jsx("h2", Object.assign({ className: "mt-3" }, { children: "Connect your wallet to start" }))] })) })) })) }))) : "", _jsx(BrowserRouter, { children: _jsx(Routes, { children: _jsxs(Route, Object.assign({ path: "/" }, { children: [_jsx(Route, { index: true, element: _jsx(SwapTab, { swapper: swapper, supportedCurrencies: smartChainCurrencies }) }), _jsxs(Route, Object.assign({ path: "scan" }, { children: [_jsx(Route, { index: true, element: _jsx(QuickScanScreen, {}) }), _jsx(Route, { path: "2", element: _jsx(Step2Screen, { swapper: swapper }) })] })), _jsx(Route, { path: "history", element: _jsx(HistoryScreen, { swapper: swapper }) })] })) }) })] })) }))] }));
}
function App() {
    return (_jsx("div", Object.assign({ className: "App d-flex flex-column" }, { children: _jsx(WalletTab, { children: _jsx(WrappedApp, {}) }) })));
}
export default App;

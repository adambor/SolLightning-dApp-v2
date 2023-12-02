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
import { Alert, Button, Container, Nav, Navbar, Spinner } from "react-bootstrap";
import { FAQ } from "./info/FAQ";
import { About } from "./info/About";
require('@solana/wallet-adapter-react-ui/styles.css');
function WrappedApp() {
    const wallet = useAnchorWallet();
    const { connection } = useConnection();
    const [provider, setProvider] = React.useState();
    const [swapper, setSwapper] = React.useState();
    const [swapperLoadingError, setSwapperLoadingError] = React.useState();
    const [actionableSwaps, setActionableSwaps] = React.useState([]);
    // @ts-ignore
    const pathName = window.location.pathname;
    const loadSwapper = async (_provider) => {
        setSwapperLoadingError(null);
        try {
            console.log("init start");
            const swapper = new SolanaSwapper(_provider, createSwapperOptions(FEConstants.chain, null, null, null, {
                getTimeout: 15000,
                postTimeout: 30000
            }));
            await swapper.init();
            console.log(swapper);
            console.log("Swapper initialized, getting claimable swaps...");
            setSwapper(swapper);
            const actionableSwaps = (await swapper.getActionableSwaps());
            console.log("actionable swaps: ", actionableSwaps);
            setActionableSwaps(actionableSwaps);
            console.log("Initialized");
        }
        catch (e) {
            setSwapperLoadingError(e.toString());
            console.error(e);
        }
    };
    React.useEffect(() => {
        if (pathName === "/about" || pathName === "/faq")
            return;
        if (wallet == null) {
            setSwapper(null);
            setProvider(null);
            setActionableSwaps([]);
            return;
        }
        const _provider = new AnchorProvider(connection, wallet, { preflightCommitment: "processed" });
        console.log("New signer set: ", wallet.publicKey);
        setProvider(_provider);
        loadSwapper(_provider);
    }, [wallet]);
    return (_jsxs(_Fragment, { children: [_jsx(Navbar, Object.assign({ collapseOnSelect: true, expand: "md", bg: "dark", variant: "dark", className: "bg-dark bg-opacity-50", style: { zIndex: 1000 } }, { children: _jsxs(Container, { children: [_jsxs(Navbar.Brand, Object.assign({ href: "/", className: "fw-semibold" }, { children: [_jsx("img", { src: "/icons/logoicon.png", className: "logo-img" }), "SolLightning"] })), _jsx(Navbar.Toggle, { "aria-controls": "basic-navbar-nav", className: "ms-3" }), _jsxs(Navbar.Collapse, Object.assign({ role: "", id: "basic-navbar-nav" }, { children: [_jsxs(Nav, Object.assign({ className: "d-flex d-md-none me-auto text-start border-top border-bottom border-dark-subtle my-2", navbarScroll: true, style: { maxHeight: '100px' } }, { children: [pathName === "/about" || pathName === "/faq" ? (_jsx(Nav.Link, Object.assign({ href: "/" }, { children: "Swap" }))) : "", _jsx(Nav.Link, Object.assign({ href: "/about" }, { children: "About" })), _jsx(Nav.Link, Object.assign({ href: "/faq" }, { children: "FAQ" })), _jsx(Nav.Link, Object.assign({ href: "https://github.com/adambor/SolLightning-sdk", target: "_blank" }, { children: "Integrate" }))] })), _jsxs(Nav, Object.assign({ className: "d-none d-md-flex me-auto text-start", navbarScroll: true, style: { maxHeight: '100px' } }, { children: [pathName === "/about" || pathName === "/faq" ? (_jsx(Nav.Link, Object.assign({ href: "/" }, { children: "Swap" }))) : "", _jsx(Nav.Link, Object.assign({ href: "/about" }, { children: "About" })), _jsx(Nav.Link, Object.assign({ href: "/faq" }, { children: "FAQ" })), _jsx(Nav.Link, Object.assign({ href: "https://github.com/adambor/SolLightning-sdk", target: "_blank" }, { children: "Integrate" }))] })), _jsx(Nav, Object.assign({ className: "ms-auto" }, { children: _jsxs("div", Object.assign({ className: "d-flex flex-row align-items-center", style: { height: "3rem" } }, { children: [_jsx("a", Object.assign({ href: "https://twitter.com/SolLightning", target: "_blank", className: "mx-2" }, { children: _jsx("img", { className: "social-icon", src: "/icons/socials/twitter.png" }) })), _jsx("a", Object.assign({ href: "https://t.me/+_MQNtlBXQ2Q1MGEy", target: "_blank", className: "mx-2" }, { children: _jsx("img", { className: "social-icon", src: "/icons/socials/telegram.png" }) })), _jsx("a", Object.assign({ href: "https://github.com/adambor/SolLightning-readme", target: "_blank", className: "ms-2 me-4" }, { children: _jsx("img", { className: "social-icon", src: "/icons/socials/github.png" }) })), swapper != null ? (_jsx("div", Object.assign({ className: "ms-auto" }, { children: _jsx(WalletMultiButton, {}) }))) : ""] })) }))] }))] }) })), _jsx(SwapsContext.Provider, Object.assign({ value: {
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
                } }, { children: _jsxs("div", Object.assign({ className: "d-flex flex-grow-1 flex-column" }, { children: [swapper == null && pathName !== "/about" && pathName !== "/faq" ? (_jsx("div", Object.assign({ className: "no-wallet-overlay d-flex align-items-center" }, { children: _jsx("div", Object.assign({ className: "mt-auto height-50 d-flex justify-content-center align-items-center flex-fill" }, { children: _jsx("div", Object.assign({ className: "text-white text-center" }, { children: provider != null && swapper == null ? (_jsx(_Fragment, { children: swapperLoadingError == null ? (_jsxs(_Fragment, { children: [_jsx(Spinner, {}), _jsx("h4", { children: "Connecting to SolLightning network..." })] })) : (_jsx(_Fragment, { children: _jsxs(Alert, Object.assign({ className: "text-center", show: true, variant: "danger", closeVariant: "white" }, { children: [_jsx("strong", { children: "SolLightning network connection error" }), _jsx("p", { children: swapperLoadingError }), _jsx(Button, Object.assign({ variant: "light", onClick: () => {
                                                            loadSwapper(provider);
                                                        } }, { children: "Retry" }))] })) })) })) : (_jsxs(_Fragment, { children: [_jsx(WalletMultiButton, {}), _jsx("h2", Object.assign({ className: "mt-3" }, { children: "Connect your wallet to start" }))] })) })) })) }))) : "", _jsx(BrowserRouter, { children: _jsx(Routes, { children: _jsxs(Route, Object.assign({ path: "/" }, { children: [_jsx(Route, { index: true, element: _jsx(SwapTab, { swapper: swapper, supportedCurrencies: smartChainCurrencies }) }), _jsxs(Route, Object.assign({ path: "scan" }, { children: [_jsx(Route, { index: true, element: _jsx(QuickScanScreen, {}) }), _jsx(Route, { path: "2", element: _jsx(Step2Screen, { swapper: swapper }) })] })), _jsx(Route, { path: "history", element: _jsx(HistoryScreen, { swapper: swapper }) }), _jsx(Route, { path: "faq", element: _jsx(FAQ, {}) }), _jsx(Route, { path: "about", element: _jsx(About, {}) })] })) }) })] })) }))] }));
}
function App() {
    return (_jsx("div", Object.assign({ className: "App d-flex flex-column" }, { children: _jsx(WalletTab, { children: _jsx(WrappedApp, {}) }) })));
}
export default App;

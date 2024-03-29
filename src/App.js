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
import { Alert, Badge, Button, Col, Container, Form, Nav, Navbar, OverlayTrigger, Row, Spinner, Tooltip } from "react-bootstrap";
import { FAQ } from "./info/FAQ";
import { About } from "./info/About";
import { Map } from "./info/Map";
import { map } from 'react-icons-kit/fa/map';
import { info } from 'react-icons-kit/fa/info';
import { question } from 'react-icons-kit/fa/question';
import { exchange } from 'react-icons-kit/fa/exchange';
import Icon from "react-icons-kit";
import { LNNFCReader, LNNFCStartResult } from './components/lnnfc/LNNFCReader';
import { ic_contactless } from 'react-icons-kit/md/ic_contactless';
import { SwapForGasScreen } from "./components/swapforgas/SwapForGasScreen";
import { SwapExplorer } from "./components/explorer/SwapExplorer";
import { ic_explore } from 'react-icons-kit/md/ic_explore';
import { AffiliateScreen } from "./components/affiliate/AffiliateScreen";
import { gift } from 'react-icons-kit/fa/gift';
import { heart } from 'react-icons-kit/fa/heart';
require('@solana/wallet-adapter-react-ui/styles.css');
// export type BtcConnectionState = {
//     declined: boolean,
//     address: string,
//     getBalance?: () => Promise<BN>,
//     sendTransaction?: (address: string, amount: BN) => Promise<void>
// };
const noWalletPaths = new Set(["/about", "/faq", "/map", "/explorer"]);
function WrappedApp() {
    const wallet = useAnchorWallet();
    const { connection } = useConnection();
    const [provider, setProvider] = React.useState();
    const [swapper, setSwapper] = React.useState();
    const [swapperLoadingError, setSwapperLoadingError] = React.useState();
    const [actionableSwaps, setActionableSwaps] = React.useState([]);
    // const [btcConnectionState, setBtcConnectionState] = React.useState<BtcConnectionState>(null);
    // @ts-ignore
    const pathName = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has("affiliate")) {
        window.localStorage.setItem("atomiq-affiliate", searchParams.get("affiliate"));
    }
    const affiliateLink = searchParams.get("affiliate") || window.localStorage.getItem("atomiq-affiliate");
    const loadSwapper = async (_provider) => {
        setSwapperLoadingError(null);
        try {
            console.log("init start");
            const options = createSwapperOptions(FEConstants.chain, null, null, null, {
                getTimeout: 15000,
                postTimeout: 30000
            });
            // options.defaultTrustedIntermediaryUrl = "http://localhost:24521";
            console.log("Created swapper options: ", options);
            const swapper = new SolanaSwapper(_provider, options);
            await swapper.init();
            console.log(swapper);
            // if(btcConnectionState==null) {
            //     const getAddressOptions = {
            //         payload: {
            //             purposes: [AddressPurpose.Payment],
            //             message: 'Bitcoin address for SolLightning swaps',
            //             network: {
            //                 type: BitcoinNetworkType.Mainnet
            //             },
            //         },
            //         onFinish: (response) => {
            //             const address = response.addresses[0].address;
            //             const connectedWallet = {
            //                 address,
            //                 declined: false,
            //                 getBalance: () => ChainUtils.getAddressBalances(address).then(val => val.confirmedBalance.add(val.unconfirmedBalance)),
            //                 sendTransaction: (recipientAddress: string, amount: BN) => new Promise<void>((resolve, reject) => {
            //                     // @ts-ignore
            //                     const amt = BigInt(amount.toString(10))
            //                     const sendBtcOptions = {
            //                         payload: {
            //                             network: {
            //                                 type: BitcoinNetworkType.Mainnet,
            //                             },
            //                             recipients: [
            //                                 {
            //                                     address: recipientAddress,
            //                                     amountSats: amt,
            //                                 }
            //                             ],
            //                             senderAddress: address,
            //                         },
            //                         onFinish: (response) => resolve(),
            //                         onCancel: () => reject(new UserError("Bitcoin transaction rejected by the user!")),
            //                     };
            //
            //                     sendBtcTransaction(sendBtcOptions).catch(reject);
            //                 })
            //             };
            //             setBtcConnectionState(connectedWallet);
            //             console.log("Bitcoin wallet connected:", connectedWallet);
            //         },
            //         onCancel: () => {
            //             setBtcConnectionState({
            //                 address: null,
            //                 declined: true
            //             });
            //             console.log("Canceled getaddress request");
            //         },
            //     };
            //
            //     getAddress(getAddressOptions).catch(err => {
            //         console.error(err)
            //     });
            // }
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
    const [scanResult, setScanResult] = React.useState(null);
    React.useEffect(() => {
        if (noWalletPaths.has(pathName))
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
    const [nfcSupported, setNfcSupported] = React.useState(false);
    const [nfcEnabled, setNfcEnabled] = React.useState(true);
    React.useEffect(() => {
        setNfcSupported(LNNFCReader.isSupported());
        setNfcEnabled(!LNNFCReader.isUserDisabled());
    }, []);
    const nfcSet = (val, target) => {
        console.log("NFC set: ", val);
        if (val === true) {
            const reader = new LNNFCReader();
            reader.start(true).then(resp => {
                console.log("start response: ", resp);
                if (resp === LNNFCStartResult.OK) {
                    setNfcEnabled(true);
                    target.checked = true;
                    reader.stop();
                }
            });
        }
        if (val === false) {
            setNfcEnabled(false);
            target.checked = false;
            LNNFCReader.userDisable();
            console.log("Set nfc disabled: ", val);
        }
    };
    console.log("nfcDisabled: ", nfcEnabled);
    return (_jsxs(_Fragment, { children: [_jsx(Navbar, Object.assign({ collapseOnSelect: true, expand: "lg ", bg: "dark", variant: "dark", className: "bg-dark bg-opacity-50", style: { zIndex: 1000, minHeight: "64px" } }, { children: _jsxs(Container, Object.assign({ className: "max-width-100" }, { children: [_jsx(Navbar.Brand, Object.assign({ href: "/", className: "d-flex flex-column" }, { children: _jsxs("div", Object.assign({ className: "d-flex flex-row", style: { fontSize: "1.5rem" } }, { children: [_jsx("img", { src: "/icons/atomiq-flask.png", className: "logo-img" }), _jsx("b", { children: "atomiq" }), _jsx("span", Object.assign({ style: { fontWeight: 300 } }, { children: ".exchange" })), FEConstants.chain === "DEVNET" ? _jsx(Badge, Object.assign({ className: "ms-2 d-flex align-items-center", bg: "danger" }, { children: "DEVNET" })) : ""] })) })), _jsxs("div", Object.assign({ className: "d-flex flex-column" }, { children: [_jsx(Badge, Object.assign({ className: "newBadgeCollapse d-lg-none" }, { children: "New!" })), _jsx(Navbar.Toggle, { "aria-controls": "basic-navbar-nav", className: "ms-3" })] })), _jsxs(Navbar.Collapse, Object.assign({ role: "", id: "basic-navbar-nav" }, { children: [_jsxs(Nav, Object.assign({ className: "d-flex d-lg-none me-auto text-start border-top border-dark-subtle my-2 " + (swapper == null ? "" : "border-bottom") }, { children: [noWalletPaths.has(pathName) || pathName === "/affiliate" ? (_jsxs(Nav.Link, Object.assign({ href: "/", className: "d-flex flex-row align-items-center" }, { children: [_jsx(Icon, { icon: exchange, className: "d-flex me-1" }), _jsx("span", { children: "Swap" })] }))) : "", _jsxs(Nav.Link, Object.assign({ href: "/map", className: "d-flex flex-row align-items-center" }, { children: [_jsx(Icon, { icon: map, className: "d-flex me-1" }), _jsx("span", Object.assign({ className: "me-auto" }, { children: "Map" })), _jsx("small", { children: "Find merchants accepting lightning!" })] })), _jsxs(Nav.Link, Object.assign({ href: "/about", className: "d-flex flex-row align-items-center" }, { children: [_jsx(Icon, { icon: info, className: "d-flex me-1" }), _jsx("span", { children: "About" })] })), _jsxs(Nav.Link, Object.assign({ href: "/faq", className: "d-flex flex-row align-items-center" }, { children: [_jsx(Icon, { icon: question, className: "d-flex me-1" }), _jsx("span", { children: "FAQ" })] })), _jsxs(Nav.Link, Object.assign({ href: "/explorer", className: "d-flex flex-row align-items-center" }, { children: [_jsx(Icon, { icon: ic_explore, className: "d-flex me-1" }), _jsx("span", { children: "Explorer" })] })), _jsxs(Nav.Link, Object.assign({ href: "/referral", className: "d-flex flex-row align-items-center" }, { children: [_jsx(Icon, { icon: gift, className: "d-flex me-1" }), _jsx("span", Object.assign({ className: "me-1" }, { children: "Referral" })), _jsx(Badge, Object.assign({ className: "me-2" }, { children: "New!" }))] })), nfcSupported ? (_jsxs("div", Object.assign({ className: "nav-link d-flex flex-row align-items-center" }, { children: [_jsx(Icon, { icon: ic_contactless, className: "d-flex me-1" }), _jsx("label", Object.assign({ title: "", htmlFor: "nfc", className: "form-check-label me-2" }, { children: "NFC enable" })), _jsx(Form.Check // prettier-ignore
                                                , { id: "nfc", type: "switch", onChange: (val) => nfcSet(val.target.checked, val.target), checked: nfcEnabled })] }))) : ""] })), _jsxs(Nav, Object.assign({ className: "d-none d-lg-flex me-auto text-start", navbarScroll: true, style: { maxHeight: '100px' } }, { children: [noWalletPaths.has(pathName) || pathName === "/affiliate" ? (_jsxs(Nav.Link, Object.assign({ href: "/", className: "d-flex flex-row align-items-center" }, { children: [_jsx(Icon, { icon: exchange, className: "d-flex me-1" }), _jsx("span", { children: "Swap" })] }))) : "", _jsx(OverlayTrigger, Object.assign({ placement: "bottom", overlay: _jsx(Tooltip, Object.assign({ id: "map-tooltip" }, { children: "Find merchants near you accepting bitcoin lightning!" })) }, { children: _jsxs(Nav.Link, Object.assign({ href: "/map", className: "d-flex flex-row align-items-center" }, { children: [_jsx(Icon, { icon: map, className: "d-flex me-1" }), _jsx("span", { children: "Map" })] })) })), _jsxs(Nav.Link, Object.assign({ href: "/about", className: "d-flex flex-row align-items-center" }, { children: [_jsx(Icon, { icon: info, className: "d-flex me-1" }), _jsx("span", { children: "About" })] })), _jsxs(Nav.Link, Object.assign({ href: "/faq", className: "d-flex flex-row align-items-center" }, { children: [_jsx(Icon, { icon: question, className: "d-flex me-1" }), _jsx("span", { children: "FAQ" })] })), _jsxs(Nav.Link, Object.assign({ href: "/explorer", className: "d-flex flex-row align-items-center" }, { children: [_jsx(Icon, { icon: ic_explore, className: "d-flex me-1" }), _jsx("span", { children: "Explorer" })] })), _jsxs(Nav.Link, Object.assign({ href: "/referral", className: "d-flex flex-column align-items-center" }, { children: [_jsxs("div", Object.assign({ className: "d-flex flex-row align-items-center" }, { children: [_jsx(Icon, { icon: gift, className: "d-flex me-1" }), _jsx("span", Object.assign({ className: "me-1" }, { children: "Referral" }))] })), _jsx(Badge, Object.assign({ className: "newBadge" }, { children: "New!" }))] })), nfcSupported ? (_jsxs("div", Object.assign({ className: "nav-link d-flex flex-row align-items-center" }, { children: [_jsx(Icon, { icon: ic_contactless, className: "d-flex me-1" }), _jsx("label", Object.assign({ title: "", htmlFor: "nfc", className: "form-check-label me-2" }, { children: "NFC enable" })), _jsx(Form.Check // prettier-ignore
                                                , { id: "nfc", type: "switch", onChange: (val) => nfcSet(val.target.checked, val.target), checked: nfcEnabled })] }))) : ""] })), swapper != null ? (_jsx(Nav, Object.assign({ className: "ms-auto" }, { children: _jsx("div", Object.assign({ className: "d-flex flex-row align-items-center", style: { height: "3rem" } }, { children: _jsx("div", Object.assign({ className: "d-flex ms-auto" }, { children: _jsx(WalletMultiButton, { className: "bg-primary" }) })) })) }))) : ""] }))] })) })), _jsxs(SwapsContext.Provider, Object.assign({ value: {
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
                } }, { children: [_jsxs("div", Object.assign({ className: "d-flex flex-grow-1 flex-column" }, { children: [swapper == null && !noWalletPaths.has(pathName) ? (_jsx("div", Object.assign({ className: "no-wallet-overlay d-flex align-items-center" }, { children: _jsx("div", Object.assign({ className: "mt-auto height-50 d-flex justify-content-center align-items-center flex-fill" }, { children: _jsx("div", Object.assign({ className: "text-white text-center" }, { children: provider != null && swapper == null ? (_jsx(_Fragment, { children: swapperLoadingError == null ? (_jsxs(_Fragment, { children: [_jsx(Spinner, {}), _jsx("h4", { children: "Connecting to atomiq network..." })] })) : (_jsx(_Fragment, { children: _jsxs(Alert, Object.assign({ className: "text-center", show: true, variant: "danger", closeVariant: "white" }, { children: [_jsx("strong", { children: "SolLightning network connection error" }), _jsx("p", { children: swapperLoadingError }), _jsx(Button, Object.assign({ variant: "light", onClick: () => {
                                                                loadSwapper(provider);
                                                            } }, { children: "Retry" }))] })) })) })) : (_jsxs(_Fragment, { children: [_jsx(WalletMultiButton, {}), _jsx("h2", Object.assign({ className: "mt-3" }, { children: "Connect your wallet to start" }))] })) })) })) }))) : "", _jsx(BrowserRouter, { children: _jsx(Routes, { children: _jsxs(Route, Object.assign({ path: "/" }, { children: [_jsx(Route, { index: true, element: _jsx(SwapTab, { swapper: swapper, supportedCurrencies: smartChainCurrencies }) }), _jsxs(Route, Object.assign({ path: "scan" }, { children: [_jsx(Route, { index: true, element: _jsx(QuickScanScreen, {}) }), _jsx(Route, { path: "2", element: _jsx(Step2Screen, { swapper: swapper }) })] })), _jsx(Route, { path: "history", element: _jsx(HistoryScreen, { swapper: swapper }) }), _jsx(Route, { path: "gas", element: _jsx(SwapForGasScreen, { swapper: swapper }) }), _jsx(Route, { path: "faq", element: _jsx(FAQ, {}) }), _jsx(Route, { path: "about", element: _jsx(About, {}) }), _jsx(Route, { path: "map", element: _jsx(Map, {}) }), _jsx(Route, { path: "explorer", element: _jsx(SwapExplorer, {}) }), _jsx(Route, { path: "referral", element: _jsx(AffiliateScreen, { swapper: swapper }) })] })) }) })] })), _jsxs(Row, Object.assign({ className: "mt-auto bg-dark bg-opacity-50 g-0 p-2" }, { children: [_jsxs(Col, Object.assign({ className: "d-flex flex-row" }, { children: [_jsx("a", Object.assign({ href: "https://twitter.com/atomiqlabs", target: "_blank", className: "mx-2 hover-opacity-75 d-flex align-items-center" }, { children: _jsx("img", { className: "social-icon", src: "/icons/socials/twitter.png" }) })), _jsx("a", Object.assign({ href: "https://github.com/adambor/SolLightning-readme", target: "_blank", className: "mx-2 hover-opacity-75 d-flex align-items-center" }, { children: _jsx("img", { className: "social-icon", src: "/icons/socials/github.png" }) })), _jsx("a", Object.assign({ href: "https://docs.atomiq.exchange/", target: "_blank", className: "mx-2 hover-opacity-75 d-flex align-items-center" }, { children: _jsx("img", { className: "social-icon", src: "/icons/socials/gitbook.png" }) }))] })), affiliateLink != null && affiliateLink !== "" ? (_jsx(Col, Object.assign({ xs: "auto", className: "d-flex justify-content-center" }, { children: _jsx(OverlayTrigger, Object.assign({ overlay: _jsx(Tooltip, Object.assign({ id: "referral-tooltip" }, { children: _jsx("span", { children: "Swap fee reduced to 0.2%, thanks to being referred to atomiq.exchange!" }) })) }, { children: _jsxs("div", Object.assign({ className: "font-small text-white opacity-75 d-flex align-items-center " }, { children: [_jsx(Icon, { icon: heart, className: "d-flex align-items-center me-1" }), _jsx("span", Object.assign({ className: "text-decoration-dotted" }, { children: "Using referral link" }))] })) })) }))) : "", _jsx(Col, Object.assign({ className: "d-flex justify-content-end" }, { children: _jsxs("a", Object.assign({ href: "https://t.me/+_MQNtlBXQ2Q1MGEy", target: "_blank", className: "ms-auto d-flex flex-row align-items-center text-white text-decoration-none hover-opacity-75 font-small" }, { children: [_jsx("img", { className: "social-icon me-1", src: "/icons/socials/telegram.png" }), "Talk to us"] })) }))] }))] }))] }));
}
function App() {
    return (_jsx("div", Object.assign({ className: "App d-flex flex-column" }, { children: _jsx(WalletTab, { children: _jsx(WrappedApp, {}) }) })));
}
export default App;

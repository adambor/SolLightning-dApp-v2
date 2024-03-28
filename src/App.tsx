import './App.css';
import * as React from "react";
import WalletTab from "./components/WalletTab";
//import WrappedApp from "./WrappedApp";
import {QuickScanScreen} from "./components/quickscan/QuickScanScreen";
import {Step2Screen} from "./components/quickscan/Step2Screen";
import {useAnchorWallet, useConnection} from '@solana/wallet-adapter-react';
import {createSwapperOptions, NetworkError, SolanaSwapData, SolanaSwapper, UserError} from "sollightning-sdk/dist";
import {AnchorProvider} from "@coral-xyz/anchor";
import {FEConstants} from "./FEConstants";
import {SwapTab} from "./components/swap/SwapTab2";
import {smartChainCurrencies} from "./utils/Currencies";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {SwapsContext} from "./components/context/SwapsContext";
import {ChainUtils, FromBTCSwap, ISwap} from "sollightning-sdk";
import {HistoryScreen} from "./components/history/HistoryScreen";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {
    Alert,
    Badge,
    Button,
    Col,
    Container,
    Form,
    Nav,
    Navbar,
    OverlayTrigger,
    Row,
    Spinner,
    Tooltip
} from "react-bootstrap";
import {FAQ} from "./info/FAQ";
import {About} from "./info/About";
import {Map} from "./info/Map";
import {map} from 'react-icons-kit/fa/map';
import {info} from 'react-icons-kit/fa/info';
import {question} from 'react-icons-kit/fa/question';
import {exchange} from 'react-icons-kit/fa/exchange';
import {AddressPurpose, BitcoinNetworkType, getAddress, sendBtcTransaction} from 'sats-connect';
import Icon from "react-icons-kit";
import * as BN from "bn.js";
import {LNNFCReader, LNNFCStartResult} from './components/lnnfc/LNNFCReader';
import {ic_contactless} from 'react-icons-kit/md/ic_contactless';
import {BitcoinWalletButton} from "./components/wallet/BitcoinWalletButton";
import {SwapForGasScreen} from "./components/swapforgas/SwapForGasScreen";
import {SwapExplorer} from "./components/explorer/SwapExplorer";
import {ic_explore} from 'react-icons-kit/md/ic_explore';
import {AffiliateScreen} from "./components/affiliate/AffiliateScreen";
import {gift} from 'react-icons-kit/fa/gift';
import {BitcoinWallet} from './components/wallet/BitcoinWallet';
import {BitcoinWalletContext} from './components/context/BitcoinWalletContext';
import {WebLNProvider} from "webln";
import {WebLNContext} from './components/context/WebLNContext';
import {heart} from 'react-icons-kit/fa/heart';
import KeypairWallet from "sollightning-sdk/dist/wallet/KeypairWallet";
import {Keypair} from "@solana/web3.js";

require('@solana/wallet-adapter-react-ui/styles.css');

// export type BtcConnectionState = {
//     declined: boolean,
//     address: string,
//     getBalance?: () => Promise<BN>,
//     sendTransaction?: (address: string, amount: BN) => Promise<void>
// };

const noWalletPaths = new Set(["/about", "/faq", "/map", "/explorer"]);

function WrappedApp() {
    const wallet: any = useAnchorWallet();
    const {connection} = useConnection();
    const [provider, setProvider] = React.useState<AnchorProvider>();
    const [swapper, setSwapper] = React.useState<SolanaSwapper>();
    const [walletType, setWalletType] = React.useState<"real" | "fake" | "loading">("loading");
    const [swapperLoadingError, setSwapperLoadingError] = React.useState<string>();
    const [swapperLoading, setSwapperLoading] = React.useState<boolean>(false);
    const [actionableSwaps, setActionableSwaps] = React.useState<ISwap[]>([]);

    // const [btcConnectionState, setBtcConnectionState] = React.useState<BtcConnectionState>(null);

    // @ts-ignore
    const pathName = window.location.pathname.split("?")[0];

    const searchParams = new URLSearchParams(window.location.search);
    if(searchParams.has("affiliate")) {
        window.localStorage.setItem("atomiq-affiliate", searchParams.get("affiliate"));
    }

    const affiliateLink = searchParams.get("affiliate") || window.localStorage.getItem("atomiq-affiliate");

    const loadSwapper: (_provider: AnchorProvider) => Promise<SolanaSwapper> = async(_provider: AnchorProvider) => {
        setSwapperLoadingError(null);
        setSwapperLoading(true);
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

            console.log("Swapper initialized, getting claimable swaps...");

            setSwapper(swapper);

            const actionableSwaps = (await swapper.getActionableSwaps());
            console.log("actionable swaps: ", actionableSwaps);
            setActionableSwaps(actionableSwaps);

            console.log("Initialized");

            setSwapperLoading(false);

            return swapper;
        } catch (e) {
            setSwapperLoadingError(e.toString());
            console.error(e)
        }
    };

    React.useEffect(() => {

        if(noWalletPaths.has(pathName)) return;

        let isReal: boolean;

        setWalletType("loading");
        let _provider;
        if(wallet==null) {
            // setSwapper(null);
            // setProvider(null);
            // setActionableSwaps([]);
            // return;
            _provider = new AnchorProvider(connection, new KeypairWallet(Keypair.generate()), {preflightCommitment: "processed"});
            isReal = false;
        } else {
            _provider = new AnchorProvider(connection, wallet, {preflightCommitment: "processed"});
            isReal = true;
            console.log("New signer set: ", wallet.publicKey);
        }

        setProvider(_provider);

        let listener = (swap: ISwap) => {
            if(swap.isFinished()) {
                setActionableSwaps((val: ISwap[]) => val.filter(e => e!==swap));
            }
        };

        let canceled = false;
        let _swapper: SolanaSwapper;
        loadSwapper(_provider).then((swapper: SolanaSwapper) => {
            if(canceled) return;
            if(swapper!=null && listener!=null) {
                _swapper = swapper;
                swapper.on("swapState", listener);
            }
            setWalletType(isReal ? "real" : "fake");
        });

        return () => {
            canceled = true;
            if(_swapper!=null) {
                _swapper.off("swapState", listener);
            }
            listener = null;
        }

    }, [wallet]);

    const [nfcSupported, setNfcSupported] = React.useState<boolean>(false);
    const [nfcEnabled, setNfcEnabled] = React.useState<boolean>(true);

    React.useEffect(() => {
        setNfcSupported(LNNFCReader.isSupported());
        setNfcEnabled(!LNNFCReader.isUserDisabled());
    }, []);

    const nfcSet = (val: boolean, target: any) => {
        console.log("NFC set: ", val);
        if(val===true) {
            const reader = new LNNFCReader();
            reader.start(true).then(resp => {
                console.log("start response: ", resp);
                if(resp===LNNFCStartResult.OK) {
                    setNfcEnabled(true);
                    target.checked = true;
                    reader.stop();
                }
            })
        }
        if(val===false) {
            setNfcEnabled(false);
            target.checked = false;
            LNNFCReader.userDisable();
            console.log("Set nfc disabled: ", val);
        }
    };

    console.log("nfcDisabled: ", nfcEnabled);

    const [bitcoinWallet, setBitcoinWallet] = React.useState<BitcoinWallet>();
    const [webLNWallet, setWebLNWallet] = React.useState<WebLNProvider>();

    return (
        <BitcoinWalletContext.Provider value={{
            bitcoinWallet: bitcoinWallet,
            setBitcoinWallet: (wallet: BitcoinWallet) => {
                if(wallet==null) BitcoinWallet.clearState();
                setBitcoinWallet(wallet);
            }
        }}>
            <WebLNContext.Provider value={{
                lnWallet: webLNWallet,
                setLnWallet: setWebLNWallet
            }}>
                <Navbar collapseOnSelect expand="lg " bg="dark" variant="dark" className="bg-dark bg-opacity-50" style={{zIndex: 1000, minHeight: "64px"}}>
                    <Container className="max-width-100">
                        <Navbar.Brand href="/" className="d-flex flex-column">
                            <div className="d-flex flex-row" style={{fontSize: "1.5rem"}}>
                                <img src="/icons/atomiq-flask.png" className="logo-img"/>
                                <b>atomiq</b><span style={{fontWeight: 300}}>.exchange</span>
                                {(FEConstants.chain as string)==="DEVNET" ? <Badge className="ms-2 d-flex align-items-center" bg="danger">DEVNET</Badge> : ""}
                            </div>
                        </Navbar.Brand>

                        <div className="d-flex flex-column">
                            <Badge className="newBadgeCollapse d-lg-none">New!</Badge>
                            <Navbar.Toggle aria-controls="basic-navbar-nav" className="ms-3" />
                        </div>

                        <Navbar.Collapse role="" id="basic-navbar-nav">
                            <Nav className={"d-flex d-lg-none me-auto text-start border-top border-dark-subtle my-2 "+(swapper==null ? "" : "border-bottom")}>
                                {noWalletPaths.has(pathName) || pathName==="/affiliate" ? (
                                    <Nav.Link href="/" className="d-flex flex-row align-items-center"><Icon icon={exchange} className="d-flex me-1"/><span>Swap</span></Nav.Link>
                                ) : ""}
                                <Nav.Link href="/map" className="d-flex flex-row align-items-center">
                                    <Icon icon={map} className="d-flex me-1"/>
                                    <span className="me-auto">Map</span>
                                    <small>Find merchants accepting lightning!</small>
                                </Nav.Link>
                                <Nav.Link href="/about" className="d-flex flex-row align-items-center"><Icon icon={info} className="d-flex me-1"/><span>About</span></Nav.Link>
                                <Nav.Link href="/faq" className="d-flex flex-row align-items-center"><Icon icon={question} className="d-flex me-1"/><span>FAQ</span></Nav.Link>
                                <Nav.Link href="/explorer" className="d-flex flex-row align-items-center"><Icon icon={ic_explore} className="d-flex me-1"/><span>Explorer</span></Nav.Link>
                                <Nav.Link href="/referral" className="d-flex flex-row align-items-center">
                                    <Icon icon={gift} className="d-flex me-1"/>
                                    <span className="me-1">Referral</span>
                                    <Badge className="me-2">New!</Badge>
                                </Nav.Link>
                                {nfcSupported ? (
                                    <div className="nav-link d-flex flex-row align-items-center">
                                        <Icon icon={ic_contactless} className="d-flex me-1"/>
                                        <label title="" htmlFor="nfc" className="form-check-label me-2">NFC enable</label>
                                        <Form.Check // prettier-ignore
                                            id="nfc"
                                            type="switch"
                                            onChange={(val) => nfcSet(val.target.checked, val.target)}
                                            checked={nfcEnabled}
                                        />
                                    </div>
                                ) : ""}
                                {/*<Nav.Link href="https://github.com/adambor/SolLightning-sdk" target="_blank">Integrate</Nav.Link>*/}
                            </Nav>
                            <Nav className="d-none d-lg-flex me-auto text-start" navbarScroll style={{ maxHeight: '100px' }}>
                                {noWalletPaths.has(pathName) || pathName==="/affiliate" ? (
                                    <Nav.Link href="/" className="d-flex flex-row align-items-center"><Icon icon={exchange} className="d-flex me-1"/><span>Swap</span></Nav.Link>
                                ) : ""}

                                <OverlayTrigger placement="bottom" overlay={<Tooltip id="map-tooltip">
                                    Find merchants near you accepting bitcoin lightning!
                                </Tooltip>}>
                                    <Nav.Link href="/map" className="d-flex flex-row align-items-center">
                                        <Icon icon={map} className="d-flex me-1"/>
                                        <span>Map</span>
                                    </Nav.Link>
                                </OverlayTrigger>

                                <Nav.Link href="/about" className="d-flex flex-row align-items-center"><Icon icon={info} className="d-flex me-1"/><span>About</span></Nav.Link>
                                <Nav.Link href="/faq" className="d-flex flex-row align-items-center"><Icon icon={question} className="d-flex me-1"/><span>FAQ</span></Nav.Link>
                                <Nav.Link href="/explorer" className="d-flex flex-row align-items-center"><Icon icon={ic_explore} className="d-flex me-1"/><span>Explorer</span></Nav.Link>

                                <Nav.Link href="/referral" className="d-flex flex-column align-items-center">
                                    <div className="d-flex flex-row align-items-center">
                                        <Icon icon={gift} className="d-flex me-1"/>
                                        <span className="me-1">Referral</span>
                                    </div>
                                    <Badge className="newBadge">New!</Badge>
                                </Nav.Link>

                                {nfcSupported ? (
                                    <div className="nav-link d-flex flex-row align-items-center">
                                        <Icon icon={ic_contactless} className="d-flex me-1"/>
                                        <label title="" htmlFor="nfc" className="form-check-label me-2">NFC enable</label>
                                        <Form.Check // prettier-ignore
                                            id="nfc"
                                            type="switch"
                                            onChange={(val) => nfcSet(val.target.checked, val.target)}
                                            checked={nfcEnabled}
                                        />
                                    </div>
                                ) : ""}
                                {/*<Nav.Link href="https://github.com/adambor/SolLightning-sdk" target="_blank">Integrate</Nav.Link>*/}
                            </Nav>
                            <Nav className="ms-auto">
                                <div className="d-flex flex-row align-items-center" style={{height: "3rem"}}>
                                    {provider!=null ? (<div className="d-flex ms-auto">
                                        <WalletMultiButton className="bg-primary"/>
                                    </div>) : ""}
                                </div>
                            </Nav>
                        </Navbar.Collapse>

                    </Container>
                </Navbar>

                <SwapsContext.Provider value={{
                    actionableSwaps,
                    removeSwap: (swap: ISwap) => {
                        setActionableSwaps((val) => {
                            const cpy = [...val];
                            const i = cpy.indexOf(swap);
                            if(i>=0) cpy.splice(i, 1);
                            return cpy;
                        });
                    },
                    walletType,
                    swapper
                }}>
                    <div className="d-flex flex-grow-1 flex-column">
                        {swapper==null && !noWalletPaths.has(pathName) ? (
                            <div className="no-wallet-overlay d-flex align-items-center">
                                <div className="mt-auto height-50 d-flex justify-content-center align-items-center flex-fill">
                                    <div className="text-white text-center">
                                        {provider!=null && swapper==null ? (
                                            <>
                                                {swapperLoadingError==null ? (
                                                    <>
                                                        <Spinner/>
                                                        <h4>Connecting to atomiq network...</h4>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Alert className="text-center" show={true} variant="danger" closeVariant="white">
                                                            <strong>SolLightning network connection error</strong>
                                                            <p>{swapperLoadingError}</p>
                                                            <Button variant="light" onClick={() => {
                                                                loadSwapper(provider)
                                                            }}>Retry</Button>
                                                        </Alert>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <WalletMultiButton />
                                                <h2 className="mt-3">Connect your wallet to start</h2>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : ""}
                        <BrowserRouter>
                            <Routes>
                                <Route path="/">
                                    <Route index element={<SwapTab supportedCurrencies={smartChainCurrencies}/>}></Route>
                                    <Route path="scan">
                                        <Route index element={<QuickScanScreen/>}/>
                                        <Route path="2" element={<Step2Screen/>}/>
                                    </Route>
                                    <Route path="history" element={<HistoryScreen/>}/>
                                    <Route path="gas" element={<SwapForGasScreen/>}/>
                                    <Route path="faq" element={<FAQ/>}/>
                                    <Route path="about" element={<About/>}/>
                                    <Route path="map" element={<Map/>}/>
                                    <Route path="explorer" element={<SwapExplorer/>}/>
                                    <Route path="referral" element={<AffiliateScreen/>}/>
                                </Route>
                            </Routes>
                        </BrowserRouter>
                    </div>
                    <Row className="mt-auto bg-dark bg-opacity-50 g-0 p-2">

                        <Col className="d-flex flex-row">
                            <a href="https://twitter.com/atomiqlabs" target="_blank" className="mx-2 hover-opacity-75 d-flex align-items-center"><img className="social-icon" src="/icons/socials/twitter.png"/></a>
                            <a href="https://github.com/adambor/SolLightning-readme" target="_blank" className="mx-2 hover-opacity-75 d-flex align-items-center"><img className="social-icon" src="/icons/socials/github.png"/></a>
                            <a href="https://docs.atomiq.exchange/" target="_blank" className="mx-2 hover-opacity-75 d-flex align-items-center"><img className="social-icon" src="/icons/socials/gitbook.png"/></a>
                        </Col>

                        {affiliateLink!=null && affiliateLink!=="" ? (
                            <Col xs={"auto"} className="d-flex justify-content-center">
                                <OverlayTrigger overlay={<Tooltip id="referral-tooltip">
                                    <span>Swap fee reduced to 0.2%, thanks to being referred to atomiq.exchange!</span>
                                </Tooltip>}>
                                    <div className="font-small text-white opacity-75 d-flex align-items-center ">
                                        <Icon icon={heart} className="d-flex align-items-center me-1"/><span className="text-decoration-dotted">Using referral link</span>
                                    </div>
                                </OverlayTrigger>
                            </Col>
                        ) : ""}

                        <Col className="d-flex justify-content-end">
                            <a href="https://t.me/+_MQNtlBXQ2Q1MGEy" target="_blank" className="ms-auto d-flex flex-row align-items-center text-white text-decoration-none hover-opacity-75 font-small">
                                <img className="social-icon me-1" src="/icons/socials/telegram.png"/>Talk to us
                            </a>
                        </Col>
                    </Row>
                </SwapsContext.Provider>
            </WebLNContext.Provider>
        </BitcoinWalletContext.Provider>
    )
}

function App() {
    return (
        <div className="App d-flex flex-column">
            <WalletTab>
                <WrappedApp/>
            </WalletTab>
        </div>
    );
}

export default App;

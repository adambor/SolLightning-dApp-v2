import './App.css';
import * as React from "react";
import WalletTab from "./components/WalletTab";
//import WrappedApp from "./WrappedApp";
import {QuickScanScreen} from "./components/quickscan/QuickScanScreen";
import {Step2Screen} from "./components/quickscan/Step2Screen";
import {useAnchorWallet, useConnection} from '@solana/wallet-adapter-react';
import {createSwapperOptions, NetworkError, SolanaSwapper} from "sollightning-sdk/dist";
import {AnchorProvider} from "@coral-xyz/anchor";
import {FEConstants} from "./FEConstants";
import {SwapTab} from "./components/swap/SwapTab2";
import {smartChainCurrencies} from "./utils/Currencies";
import {BrowserRouter, Route, Routes, useLocation, useNavigate} from "react-router-dom";
import {SwapsContext} from "./components/context/SwapsContext";
import {FromBTCSwap, ISwap} from "sollightning-sdk";
import {HistoryScreen} from "./components/history/HistoryScreen";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {
    Alert,
    Badge,
    Button,
    Card,
    Container, Form,
    Nav,
    Navbar,
    NavDropdown,
    OverlayTrigger,
    Spinner, Tooltip
} from "react-bootstrap";
import {FAQ} from "./info/FAQ";
import {About} from "./info/About";
import {Map} from "./info/Map";
import {map} from 'react-icons-kit/fa/map';
import {info} from 'react-icons-kit/fa/info';
import {question} from 'react-icons-kit/fa/question';
import {exchange} from 'react-icons-kit/fa/exchange';
import Icon from "react-icons-kit";

require('@solana/wallet-adapter-react-ui/styles.css');

function WrappedApp() {

    const wallet: any = useAnchorWallet();
    const {connection} = useConnection();
    const [provider, setProvider] = React.useState<AnchorProvider>();
    const [swapper, setSwapper] = React.useState<SolanaSwapper>();
    const [swapperLoadingError, setSwapperLoadingError] = React.useState<string>();
    const [actionableSwaps, setActionableSwaps] = React.useState<ISwap[]>([]);

    // @ts-ignore
    const pathName = window.location.pathname;

    const loadSwapper = async(_provider: AnchorProvider) => {
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
        } catch (e) {
            setSwapperLoadingError(e.toString());
            console.error(e)
        }
    };

    React.useEffect(() => {

        if(pathName==="/about" || pathName==="/faq" || pathName==="/map") return;

        if(wallet==null) {
            setSwapper(null);
            setProvider(null);
            setActionableSwaps([]);
            return;
        }

        const _provider = new AnchorProvider(connection, wallet, {preflightCommitment: "processed"});

        console.log("New signer set: ", wallet.publicKey);

        setProvider(_provider);

        loadSwapper(_provider);
    }, [wallet]);

    return (
        <>
            <Navbar collapseOnSelect expand="md" bg="dark" variant="dark" className="bg-dark bg-opacity-50" style={{zIndex: 1000, minHeight: "64px"}}>
                <Container>
                    <Navbar.Brand href="/" className="fw-semibold">
                        <img src="/icons/logoicon.png" className="logo-img"/>SolLightning
                    </Navbar.Brand>

                    <div className="d-flex flex-column">
                        <Badge className="newBadgeCollapse d-md-none">New!</Badge>
                        <Navbar.Toggle aria-controls="basic-navbar-nav" className="ms-3" />
                    </div>

                    <Navbar.Collapse role="" id="basic-navbar-nav">
                        <Nav className="d-flex d-md-none me-auto text-start border-top border-bottom border-dark-subtle my-2" navbarScroll style={{ maxHeight: '100px' }}>
                            {pathName==="/about" || pathName==="/faq" || pathName==="/map" ? (
                                <Nav.Link href="/" className="d-flex flex-row align-items-center"><Icon icon={exchange} className="d-flex me-1"/><span>Swap</span></Nav.Link>
                            ) : ""}
                            <Nav.Link href="/map" className="d-flex flex-row align-items-center">
                                <Icon icon={map} className="d-flex me-1"/>
                                <span className="me-1">Map</span>
                                <Badge className="me-2">New!</Badge>
                                <small>Find merchants accepting lightning!</small>
                            </Nav.Link>
                            <Nav.Link href="/about" className="d-flex flex-row align-items-center"><Icon icon={info} className="d-flex me-1"/><span>About</span></Nav.Link>
                            <Nav.Link href="/faq" className="d-flex flex-row align-items-center"><Icon icon={question} className="d-flex me-1"/><span>FAQ</span></Nav.Link>
                            {/*<Nav.Link href="https://github.com/adambor/SolLightning-sdk" target="_blank">Integrate</Nav.Link>*/}
                        </Nav>
                        <Nav className="d-none d-md-flex me-auto text-start" navbarScroll style={{ maxHeight: '100px' }}>
                            {pathName==="/about" || pathName==="/faq" || pathName==="/map" ? (
                                <Nav.Link href="/" className="d-flex flex-row align-items-center"><Icon icon={exchange} className="d-flex me-1"/><span>Swap</span></Nav.Link>
                            ) : ""}

                            <OverlayTrigger placement="bottom" overlay={<Tooltip id="map-tooltip">
                                Find merchants near you accepting bitcoin lightning!
                            </Tooltip>}>
                                <Nav.Link href="/map" className="d-flex flex-column align-items-center">
                                    <div className="d-flex flex-row align-items-center">
                                        <Icon icon={map} className="d-flex me-1"/>
                                        <span>Map</span>
                                    </div>
                                    <Badge className="newBadge">New!</Badge>
                                </Nav.Link>
                            </OverlayTrigger>

                            <Nav.Link href="/about" className="d-flex flex-row align-items-center"><Icon icon={info} className="d-flex me-1"/><span>About</span></Nav.Link>
                            <Nav.Link href="/faq" className="d-flex flex-row align-items-center"><Icon icon={question} className="d-flex me-1"/><span>FAQ</span></Nav.Link>
                            {/*<Nav.Link href="https://github.com/adambor/SolLightning-sdk" target="_blank">Integrate</Nav.Link>*/}
                        </Nav>
                        <Nav className="ms-auto">
                            <div className="d-flex flex-row align-items-center" style={{height: "3rem"}}>
                                <a href="https://twitter.com/SolLightning" target="_blank" className="mx-2"><img className="social-icon" src="/icons/socials/twitter.png"/></a>
                                <a href="https://t.me/+_MQNtlBXQ2Q1MGEy" target="_blank" className="mx-2"><img className="social-icon" src="/icons/socials/telegram.png"/></a>
                                <a href="https://github.com/adambor/SolLightning-readme" target="_blank" className="ms-2 me-4"><img className="social-icon" src="/icons/socials/github.png"/></a>
                                {swapper!=null ? (<div className="ms-auto">
                                    <WalletMultiButton />
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
                }
            }}>
                <div className="d-flex flex-grow-1 flex-column">
                    {swapper==null && pathName!=="/about" && pathName!=="/faq" && pathName!=="/map" ? (
                        <div className="no-wallet-overlay d-flex align-items-center">
                            <div className="mt-auto height-50 d-flex justify-content-center align-items-center flex-fill">
                                <div className="text-white text-center">
                                    {provider!=null && swapper==null ? (
                                        <>
                                            {swapperLoadingError==null ? (
                                                <>
                                                    <Spinner/>
                                                    <h4>Connecting to SolLightning network...</h4>
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
                                <Route index element={<SwapTab swapper={swapper} supportedCurrencies={smartChainCurrencies}/>}></Route>
                                <Route path="scan">
                                    <Route index element={<QuickScanScreen/>}/>
                                    <Route path="2" element={<Step2Screen swapper={swapper}/>}/>
                                </Route>
                                <Route path="history" element={<HistoryScreen swapper={swapper}/>}/>
                                <Route path="faq" element={<FAQ/>}/>
                                <Route path="about" element={<About/>}/>
                                <Route path="map" element={<Map/>}/>
                            </Route>
                        </Routes>
                    </BrowserRouter>
                </div>
            </SwapsContext.Provider>
        </>
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

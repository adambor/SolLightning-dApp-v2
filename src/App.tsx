import './App.css';
import * as React from "react";
import WalletTab from "./components/WalletTab";
//import WrappedApp from "./WrappedApp";
import {QuickScanScreen} from "./components/quickscan/QuickScanScreen";
import {Step2Screen} from "./components/quickscan/Step2Screen";
import {useAnchorWallet, useConnection} from '@solana/wallet-adapter-react';
import {createSwapperOptions, SolanaSwapper} from "sollightning-sdk/dist";
import {AnchorProvider} from "@coral-xyz/anchor";
import {FEConstants} from "./FEConstants";
import {SwapTab} from "./components/swap/SwapTab2";
import {smartChainCurrencies} from "./utils/Currencies";
import {BrowserRouter, Route, Routes, useLocation, useNavigate} from "react-router-dom";
import {SwapsContext} from "./components/context/SwapsContext";
import {FromBTCSwap, ISwap} from "sollightning-sdk";
import {HistoryScreen} from "./components/history/HistoryScreen";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {Container, Nav, Navbar, NavDropdown, Spinner} from "react-bootstrap";
import {FAQ} from "./info/FAQ";
import {About} from "./info/About";

require('@solana/wallet-adapter-react-ui/styles.css');

function WrappedApp() {

    const wallet: any = useAnchorWallet();
    const {connection} = useConnection();
    const [provider, setProvider] = React.useState<AnchorProvider>();
    const [swapper, setSwapper] = React.useState<SolanaSwapper>();
    const [actionableSwaps, setActionableSwaps] = React.useState<ISwap[]>([]);

    // @ts-ignore
    const pathName = window.location.pathname;

    React.useEffect(() => {

        if(pathName==="/about" || pathName==="/faq") return;

        if(wallet==null) {
            setSwapper(null);
            setProvider(null);
            setActionableSwaps([]);
            return;
        }

        const _provider = new AnchorProvider(connection, wallet, {preflightCommitment: "processed"});

        console.log("New signer set: ", wallet.publicKey);

        setProvider(_provider);

        (async () => {

            try {
                console.log("init start");

                const swapper = new SolanaSwapper(_provider, createSwapperOptions(FEConstants.chain));

                await swapper.init();

                console.log(swapper);

                console.log("Swapper initialized, getting claimable swaps...");

                const actionableSwaps = (await swapper.getActionableSwaps());
                console.log("actionable swaps: ", actionableSwaps);
                setActionableSwaps(actionableSwaps);
                setSwapper(swapper);

                console.log("Initialized");
            } catch (e) {
                console.error(e)
            }

        })();

    }, [wallet]);

    return (
        <>
            <Navbar collapseOnSelect expand="md" bg="dark" variant="dark" className="bg-dark bg-opacity-50" style={{zIndex: 1000}}>
                <Container>
                    <Navbar.Brand href="/" className="fw-semibold">
                        <img src="./favicon.ico" className="logo-img"/>SolLightning
                    </Navbar.Brand>

                    {swapper!=null ? (<div className="ms-auto d-md-none">
                        <WalletMultiButton />
                    </div>) : ""}

                    <Navbar.Toggle aria-controls="basic-navbar-nav" className="ms-3" />

                    <Navbar.Collapse role="" id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Nav.Link href="/about">About</Nav.Link>
                            <Nav.Link href="/faq">FAQ</Nav.Link>
                            <NavDropdown title="Integrate" id="basic-nav-dropdown">
                                <NavDropdown.Item href="https://github.com/adambor/SolLightning-sdk" target="_blank">Use SolLightning SDK</NavDropdown.Item>
                            </NavDropdown>
                        </Nav>
                        <Nav className="ms-auto">
                            <Nav.Link href="https://twitter.com/SolLightning" target="_blank" onClick={() => console.log("Home clicked")}><img className="social-icon" src="./icons/socials/twitter.png"/></Nav.Link>
                            <Nav.Link href="https://t.me/+_MQNtlBXQ2Q1MGEy" target="_blank" onClick={() => console.log("Home clicked")}><img className="social-icon" src="./icons/socials/telegram.png"/></Nav.Link>
                            <Nav.Link href="https://github.com/adambor/SolLightning-readme" target="_blank" onClick={() => console.log("Home clicked")}><img className="social-icon" src="./icons/socials/github.png"/></Nav.Link>
                        </Nav>
                    </Navbar.Collapse>

                    {swapper!=null ? (<div className="ms-3 d-none d-md-block">
                        <WalletMultiButton />
                    </div>) : ""}
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
                    {swapper==null && pathName!=="/about" && pathName!=="/faq" ? (
                        <div className="no-wallet-overlay d-flex align-items-center">
                            <div className="mt-auto height-50 d-flex justify-content-center align-items-center flex-fill">
                                <div className="text-white text-center">
                                    {provider!=null && swapper==null ? (
                                        <>
                                            <Spinner/>
                                            <h4>Connecting to SolLightning network...</h4>
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

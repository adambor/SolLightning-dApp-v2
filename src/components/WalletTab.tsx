import * as React from "react";
import {WalletModalProvider, WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {ConnectionProvider, WalletProvider} from "@solana/wallet-adapter-react";
import {LedgerWalletAdapter, PhantomWalletAdapter, SlopeWalletAdapter,
    SolletExtensionWalletAdapter,
    SolletWalletAdapter, TorusWalletAdapter, SolflareWalletAdapter} from "@solana/wallet-adapter-wallets";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";
import fetch from "cross-fetch";
import {NetworkError} from "sollightning-sdk";

//const endpoint = "https://api.devnet.solana.com";
const endpoint = "https://vevay-8ywdib-fast-mainnet.helius-rpc.com/";
const network = WalletAdapterNetwork.Mainnet;

const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network }),
    new SlopeWalletAdapter(),
    new TorusWalletAdapter(),
    new LedgerWalletAdapter(),
    new SolletWalletAdapter({ network }),
    new SolletExtensionWalletAdapter({ network }),
];

const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit) => {
    if(init==null) init = {};

    let timedOut = false;
    const abortController = new AbortController();
    const timeoutHandle = setTimeout(() => {
        timedOut = true;
        abortController.abort("Timed out")
    }, 15000);
    let originalSignal: AbortSignal;
    if(init.signal!=null) {
        originalSignal = init.signal;
        init.signal.addEventListener("abort", (reason) => {
            clearTimeout(timeoutHandle);
            abortController.abort(reason);
        });
    }
    init.signal = abortController.signal;
    try {
        return await fetch(input, init)
    } catch(e) {
        if(e.name==="AbortError" && (originalSignal==null || !originalSignal.aborted) && timedOut) {
            throw new NetworkError("Network request timed out")
        } else {
            throw e;
        }
    }
};

function WalletTab(props: {
    children: any
}) {
    return (
        <ConnectionProvider endpoint={endpoint} config={{fetch: fetchWithTimeout, commitment: "confirmed"}}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {props.children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    )

}

export default WalletTab;
import { jsx as _jsx } from "react/jsx-runtime";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { LedgerWalletAdapter, PhantomWalletAdapter, SlopeWalletAdapter, SolletExtensionWalletAdapter, SolletWalletAdapter, TorusWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import fetch from "cross-fetch";
import { NetworkError } from "sollightning-sdk";
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
const fetchWithTimeout = async (input, init) => {
    if (init == null)
        init = {};
    let timedOut = false;
    const abortController = new AbortController();
    const timeoutHandle = setTimeout(() => {
        timedOut = true;
        abortController.abort("Timed out");
    }, 15000);
    let originalSignal;
    if (init.signal != null) {
        originalSignal = init.signal;
        init.signal.addEventListener("abort", (reason) => {
            clearTimeout(timeoutHandle);
            abortController.abort(reason);
        });
    }
    init.signal = abortController.signal;
    try {
        return await fetch(input, init);
    }
    catch (e) {
        if (e.name === "AbortError" && (originalSignal == null || !originalSignal.aborted) && timedOut) {
            throw new NetworkError("Network request timed out");
        }
        else {
            throw e;
        }
    }
};
function WalletTab(props) {
    return (_jsx(ConnectionProvider, Object.assign({ endpoint: endpoint, config: { fetch: fetchWithTimeout, commitment: "confirmed" } }, { children: _jsx(WalletProvider, Object.assign({ wallets: wallets, autoConnect: true }, { children: _jsx(WalletModalProvider, { children: props.children }) })) })));
}
export default WalletTab;

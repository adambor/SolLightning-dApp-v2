import { jsx as _jsx } from "react/jsx-runtime";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { LedgerWalletAdapter, PhantomWalletAdapter, SlopeWalletAdapter, SolletExtensionWalletAdapter, SolletWalletAdapter, TorusWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
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
function WalletTab(props) {
    return (_jsx(ConnectionProvider, Object.assign({ endpoint: endpoint }, { children: _jsx(WalletProvider, Object.assign({ wallets: wallets, autoConnect: true }, { children: _jsx(WalletModalProvider, { children: props.children }) })) })));
}
export default WalletTab;

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Container, Navbar } from "react-bootstrap";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { LedgerWalletAdapter, PhantomWalletAdapter, SlopeWalletAdapter, SolletExtensionWalletAdapter, SolletWalletAdapter, TorusWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
//const endpoint = "https://api.devnet.solana.com";
const endpoint = "https://flashy-tiniest-scion.solana-mainnet.discover.quiknode.pro/a1dc691e8c005da3b38636ca47f0155b8fd8439e/";
//const endpoint = "https://solana-mainnet.g.alchemy.com/v2/4CRGDYXo0ojTbGdKtKt6KZbWLgbWxMcS";
//export const RPC_ENDPOINT = "https://rpc.helius.xyz/?api-key=b787bcff-87f9-493a-a7e7-d634f5263c70";
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
    return (_jsx(ConnectionProvider, Object.assign({ endpoint: endpoint }, { children: _jsx(WalletProvider, Object.assign({ wallets: wallets, autoConnect: true }, { children: _jsxs(WalletModalProvider, { children: [_jsx(Navbar, Object.assign({ bg: "dark", variant: "dark" }, { children: _jsxs(Container, { children: [_jsx(Navbar.Brand, Object.assign({ href: "#home", className: "fw-semibold" }, { children: "SolLightning" })), _jsx("div", Object.assign({ className: "ms-auto" }, { children: _jsx(WalletMultiButton, {}) }))] }) })), _jsx("div", Object.assign({ className: "d-flex flex-grow-1" }, { children: props.children }))] }) })) })));
}
export default WalletTab;

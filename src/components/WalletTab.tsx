import {Container, Navbar} from "react-bootstrap";
import * as React from "react";
import {WalletModalProvider, WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {ConnectionProvider, WalletProvider} from "@solana/wallet-adapter-react";
import {LedgerWalletAdapter, PhantomWalletAdapter, SlopeWalletAdapter,
    SolletExtensionWalletAdapter,
    SolletWalletAdapter, TorusWalletAdapter, SolflareWalletAdapter} from "@solana/wallet-adapter-wallets";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";

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

function WalletTab(props: {
    children: any
}) {
    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {props.children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    )

}

export default WalletTab;
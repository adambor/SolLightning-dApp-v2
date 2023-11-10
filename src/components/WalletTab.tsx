import {Container, Navbar} from "react-bootstrap";
import * as React from "react";
import {WalletModalProvider, WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {ConnectionProvider, WalletProvider} from "@solana/wallet-adapter-react";
import {LedgerWalletAdapter, PhantomWalletAdapter, SlopeWalletAdapter,
    SolletExtensionWalletAdapter,
    SolletWalletAdapter, TorusWalletAdapter, SolflareWalletAdapter} from "@solana/wallet-adapter-wallets";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";

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
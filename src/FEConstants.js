import BigNumber from "bignumber.js";
import { SolanaChains } from "sollightning-sdk";
import { PublicKey } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
const solanaRpcUrl = process.env.REACT_APP_SOLANA_RPC_URL;
const chain = process.env.REACT_APP_SOLANA_NETWORK; //DEVNET or MAINNET
const btcBlockExplorer = process.env.REACT_APP_BTC_BLOCK_EXPLORER;
const solBlockExplorer = process.env.REACT_APP_SOL_BLOCK_EXPLORER;
const statsUrl = process.env.REACT_APP_STATS_URL;
// const solanaRpcUrl: string = "https://api.devnet.solana.com";
// const chain: "DEVNET" | "MAINNET" = "DEVNET"; //DEVNET or MAINNET
// const btcBlockExplorer: string = "https://mempool.space/testnet/tx/";
console.log("SOLana chain: ", chain);
console.log("SOLana RPC: ", solanaRpcUrl);
export const FEConstants = {
    // expirySecondsBTCLNtoSol: 1*86400, //1 days
    // expirySecondsSoltoBTCLN: 3*86400, //3 days
    // confirmationsSoltoBTC: 3,
    // confirmationTargetSoltoBTC: 3,
    // url: "https://node3.gethopa.com",
    // customPorts: {
    //     [SwapType.BTCLN_TO_SOL]: 34000,
    //     [SwapType.SOL_TO_BTCLN]: 34001,
    //     [SwapType.BTC_TO_SOL]: 34002,
    //     [SwapType.SOL_TO_BTC]: 34003,
    // },
    // url: "http://localhost:4000",
    // customPorts: null,
    btcBlockExplorer,
    solBlockExplorer,
    statsUrl,
    solanaChain: chain === "MAINNET" ? WalletAdapterNetwork.Mainnet : WalletAdapterNetwork.Devnet,
    rpcUrl: solanaRpcUrl,
    chain,
    wbtcToken: new PublicKey(SolanaChains[chain].tokens.WBTC),
    usdcToken: new PublicKey(SolanaChains[chain].tokens.USDC),
    usdtToken: new PublicKey(SolanaChains[chain].tokens.USDT),
    wsolToken: new PublicKey(SolanaChains[chain].tokens.WSOL),
    tokenData: {
        [SolanaChains[chain].tokens.WBTC]: {
            decimals: 8,
            symbol: "WBTC"
        },
        [SolanaChains[chain].tokens.USDC]: {
            decimals: 6,
            symbol: "USDC"
        },
        [SolanaChains[chain].tokens.USDT]: {
            decimals: 6,
            symbol: "USDT"
        },
        [SolanaChains[chain].tokens.WSOL]: {
            decimals: 9,
            symbol: "SOL"
        }
    },
    url: null,
    satsPerBitcoin: new BigNumber(100000000),
    USDollar: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    })
};

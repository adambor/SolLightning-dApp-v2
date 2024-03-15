import {BitcoinNetworkType, getCapabilities} from "sats-connect";
import {PhantomBitcoinWallet} from "./PhantomBitcoinWallet";
import {XverseBitcoinWallet} from "./XverseBitcoinWallet";
import {BitcoinWallet} from "./BitcoinWallet";

export type BitcoinWalletType = {
    iconUrl: string,
    name: string,
    detect: () => Promise<boolean>,
    use: () => Promise<BitcoinWallet>
};

const bitcoinWalletList: BitcoinWalletType[] = [
    {
        iconUrl: PhantomBitcoinWallet.iconUrl,
        name: PhantomBitcoinWallet.walletName,
        detect: PhantomBitcoinWallet.isInstalled,
        use: PhantomBitcoinWallet.init
    },
    {
        iconUrl: XverseBitcoinWallet.iconUrl,
        name: XverseBitcoinWallet.walletName,
        detect: XverseBitcoinWallet.isInstalled,
        use: XverseBitcoinWallet.init
    }
];

let installedBitcoinWallets: BitcoinWalletType[];

export async function getInstalledBitcoinWallets(): Promise<BitcoinWalletType[]> {
    if(installedBitcoinWallets!=null) return installedBitcoinWallets;

    const resultArr: BitcoinWalletType[] = [];
    for(let wallet of bitcoinWalletList) {
        if(await wallet.detect()) {
            resultArr.push(wallet);
        }
    }
    return installedBitcoinWallets = resultArr;
}
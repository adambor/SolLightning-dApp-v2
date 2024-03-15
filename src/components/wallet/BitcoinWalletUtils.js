import { PhantomBitcoinWallet } from "./PhantomBitcoinWallet";
import { XverseBitcoinWallet } from "./XverseBitcoinWallet";
const bitcoinWalletList = [
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
let installedBitcoinWallets;
export async function getInstalledBitcoinWallets() {
    if (installedBitcoinWallets != null)
        return installedBitcoinWallets;
    const resultArr = [];
    for (let wallet of bitcoinWalletList) {
        if (await wallet.detect()) {
            resultArr.push(wallet);
        }
    }
    return installedBitcoinWallets = resultArr;
}

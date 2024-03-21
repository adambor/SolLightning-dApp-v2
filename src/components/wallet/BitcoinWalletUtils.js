import { PhantomBitcoinWallet } from "./PhantomBitcoinWallet";
import { XverseBitcoinWallet } from "./XverseBitcoinWallet";
import { BitcoinWallet } from "./BitcoinWallet";
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
    if (installedBitcoinWallets == null) {
        const resultArr = [];
        for (let wallet of bitcoinWalletList) {
            if (await wallet.detect()) {
                resultArr.push(wallet);
            }
        }
        installedBitcoinWallets = resultArr;
    }
    let active = null;
    const activeWallet = BitcoinWallet.loadState();
    if (activeWallet != null) {
        const walletType = bitcoinWalletList.find(e => e.name === activeWallet.name);
        if (walletType != null) {
            active = () => walletType.use(activeWallet.data);
        }
    }
    return {
        installed: installedBitcoinWallets,
        active
    };
}
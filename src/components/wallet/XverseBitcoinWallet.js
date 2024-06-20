import { SatsConnectBitcoinWallet } from "./SatsConnectBitcoinWallet";
import { XdefiBitcoinWallet } from "./XdefiBitcoinWallet";
import { MagicEdenBitcoinWallet } from "./MagicEdenBitcoinWallet";
export class XverseBitcoinWallet extends SatsConnectBitcoinWallet {
    static async isInstalled() {
        if (await SatsConnectBitcoinWallet.isInstalled()) {
            if (Object.keys(window.BitcoinProvider).find(key => key.startsWith("is")) == null &&
                !XdefiBitcoinWallet.checkCorrectWallet() &&
                !MagicEdenBitcoinWallet.checkCorrectWallet())
                return true;
        }
        return false;
    }
    static init(_data) {
        return SatsConnectBitcoinWallet.init(XverseBitcoinWallet.walletName, XverseBitcoinWallet.iconUrl, XverseBitcoinWallet, _data);
    }
}
XverseBitcoinWallet.iconUrl = "wallets/btc/xverse.png";
XverseBitcoinWallet.walletName = "Xverse";

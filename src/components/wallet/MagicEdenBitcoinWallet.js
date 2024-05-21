import { SatsConnectBitcoinWallet } from "./SatsConnectBitcoinWallet";
export class MagicEdenBitcoinWallet extends SatsConnectBitcoinWallet {
    static async isInstalled() {
        if (await SatsConnectBitcoinWallet.isInstalled()) {
            if (window.BitcoinProvider.isMagicEden)
                return true;
        }
        return false;
    }
    static init(_data) {
        return SatsConnectBitcoinWallet.init(MagicEdenBitcoinWallet.walletName, MagicEdenBitcoinWallet.iconUrl, MagicEdenBitcoinWallet, _data);
    }
}
MagicEdenBitcoinWallet.iconUrl = "wallets/btc/MagicEden.png";
MagicEdenBitcoinWallet.walletName = "Magic Eden";

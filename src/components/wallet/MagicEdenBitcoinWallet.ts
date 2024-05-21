import {SatsConnectBitcoinWallet} from "./SatsConnectBitcoinWallet";

export class MagicEdenBitcoinWallet extends SatsConnectBitcoinWallet {

    static iconUrl: string = "wallets/btc/MagicEden.png";
    static walletName: string = "Magic Eden";

    static async isInstalled(): Promise<boolean> {
        if(await SatsConnectBitcoinWallet.isInstalled()) {
            if((window.BitcoinProvider as any).isMagicEden) return true;
        }
        return false;
    }

    static init(_data?: any): Promise<MagicEdenBitcoinWallet> {
        return SatsConnectBitcoinWallet.init(MagicEdenBitcoinWallet.walletName, MagicEdenBitcoinWallet.iconUrl, MagicEdenBitcoinWallet, _data);
    }

}
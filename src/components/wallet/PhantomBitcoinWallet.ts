import * as BN from "bn.js";
import {ChainUtils} from "sollightning-sdk";
import {BitcoinWallet} from "./BitcoinWallet";
import {CoinselectAddressTypes} from "./coinselect2/utils";
import * as bitcoin from "bitcoinjs-lib";

const addressTypePriorities = {
    "p2tr": 0,
    "p2wpkh": 1,
    "p2sh": 2,
    "p2pkh": 3
};

const ADDRESS_FORMAT_MAP: {[key: string]: CoinselectAddressTypes} = {
    "p2tr" : "p2tr",
    "p2wpkh": "p2wpkh",
    "p2sh": "p2sh-p2wpkh",
    "p2pkh": "p2pkh"
};

type PhantomBtcAccount = {
    address: string;
    addressType: "p2tr" | "p2wpkh" | "p2sh" | "p2pkh";
    publicKey: string;
    purpose: "payment" | "ordinals";
};

type PhantomBtcProvider = {
    requestAccounts: () => Promise<PhantomBtcAccount[]>,
    signMessage: (message: Uint8Array, address: string) => Promise<{signature: Uint8Array}>,
    signPSBT: (psbtHex: Uint8Array, options: {inputsToSign: {sigHash?: number | undefined, address: string, signingIndexes: number[]}[]}) => Promise<string>,
    isPhantom?: boolean
};

export class PhantomBitcoinWallet extends BitcoinWallet {

    static iconUrl: string = "wallets/btc/phantom.png";
    static walletName: string = "Phantom";

    readonly provider: PhantomBtcProvider;
    readonly account: PhantomBtcAccount;

    constructor(provider: PhantomBtcProvider, account: PhantomBtcAccount) {
        super();
        this.provider = provider;
        this.account = account;
    }

    static isInstalled(): Promise<boolean> {
        const isPhantomInstalled = (window as any)?.phantom?.bitcoin?.isPhantom;
        return Promise.resolve(isPhantomInstalled);
    }

    static async init(_data?: any): Promise<PhantomBitcoinWallet> {
        const provider: PhantomBtcProvider = (window as any)?.phantom?.bitcoin;

        if(_data!=null) {
            const data: {
                account: PhantomBtcAccount
            } = _data;

            return new PhantomBitcoinWallet(provider, data.account);
        }

        if(provider==null) throw new Error("Phantom bitcoin wallet not found");
        if(provider.isPhantom==null) throw new Error("Provider is not Phantom wallet");
        const accounts: PhantomBtcAccount[] = await provider.requestAccounts();
        const paymentAccounts = accounts.filter(e => e.purpose==="payment");
        if(paymentAccounts.length===0) throw new Error("No valid payment account found");
        paymentAccounts.sort((a, b) => addressTypePriorities[a.addressType] - addressTypePriorities[b.addressType]);
        BitcoinWallet.saveState(PhantomBitcoinWallet.walletName, {
            account: paymentAccounts[0]
        });
        return new PhantomBitcoinWallet(provider, paymentAccounts[0]);
    }

    getBalance(): Promise<{ confirmedBalance: BN; unconfirmedBalance: BN }> {
        return ChainUtils.getAddressBalances(this.account.address);
    }

    getReceiveAddress(): string {
        return this.account.address;
    }

    getSpendableBalance(): Promise<{
        balance: BN,
        feeRate: number,
        totalFee: number
    }> {
        return this._getSpendableBalance(this.account.address, ADDRESS_FORMAT_MAP[this.account.addressType]);
    }

    async getTransactionFee(address: string, amount: BN, feeRate?: number): Promise<number> {
        const {psbt, fee} = await super._getPsbt(this.account.publicKey, this.account.address, ADDRESS_FORMAT_MAP[this.account.addressType], address, amount.toNumber(), feeRate);
        if(psbt==null) return null;
        return fee;
    }

    async sendTransaction(address: string, amount: BN, feeRate?: number): Promise<string> {
        const {psbt} = await super._getPsbt(this.account.publicKey, this.account.address, ADDRESS_FORMAT_MAP[this.account.addressType], address, amount.toNumber(), feeRate);

        if(psbt==null) {
            throw new Error("Not enough balance!");
        }

        const psbtHex = psbt.toBuffer();

        const resultSignedPsbtHex = await this.provider.signPSBT(psbtHex, {
            inputsToSign: [{
                sigHash: 0x01,
                address: this.account.address,
                signingIndexes: psbt.txInputs.map(e => e.index)
            }]
        });

        const signedPsbt = bitcoin.Psbt.fromHex(resultSignedPsbtHex);

        const btcTx = signedPsbt.extractTransaction();

        const btcTxHex = btcTx.toHex();

        return await ChainUtils.sendTransaction(btcTxHex);
    }

    getName(): string {
        return PhantomBitcoinWallet.walletName;
    }

    getIcon(): string {
        return PhantomBitcoinWallet.iconUrl;
    }

}
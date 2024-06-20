import { AddressPurpose, BitcoinNetworkType, getCapabilities, getAddress, signTransaction } from "sats-connect";
import { BitcoinWallet } from "./BitcoinWallet";
import { FEConstants } from "../../FEConstants";
import { ChainUtils } from "sollightning-sdk";
import * as bitcoin from "bitcoinjs-lib";
const network = FEConstants.chain === "DEVNET" ? BitcoinNetworkType.Testnet : BitcoinNetworkType.Mainnet;
const bitcoinNetwork = FEConstants.chain === "DEVNET" ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
function identifyAddressType(address) {
    const outputScript = bitcoin.address.toOutputScript(address, bitcoinNetwork);
    try {
        if (bitcoin.payments.p2pkh({
            output: outputScript,
            network: bitcoinNetwork
        }).address === address)
            return "p2pkh";
    }
    catch (e) {
        console.error(e);
    }
    try {
        if (bitcoin.payments.p2wpkh({
            output: outputScript,
            network: bitcoinNetwork
        }).address === address)
            return "p2wpkh";
    }
    catch (e) {
        console.error(e);
    }
    try {
        if (bitcoin.payments.p2tr({
            output: outputScript,
            network: bitcoinNetwork
        }).address === address)
            return "p2tr";
    }
    catch (e) {
        console.error(e);
    }
    try {
        if (bitcoin.payments.p2sh({
            output: outputScript,
            network: bitcoinNetwork
        }).address === address)
            return "p2sh-p2wpkh";
    }
    catch (e) {
        console.error(e);
    }
    return null;
}
function _identifyAddressType(pubkey, address) {
    const pubkeyBuffer = Buffer.from(pubkey, "hex");
    try {
        if (bitcoin.payments.p2pkh({
            pubkey: pubkeyBuffer,
            network: bitcoinNetwork
        }).address === address)
            return "p2pkh";
    }
    catch (e) {
        console.error(e);
    }
    try {
        if (bitcoin.payments.p2wpkh({
            pubkey: pubkeyBuffer,
            network: bitcoinNetwork
        }).address === address)
            return "p2wpkh";
    }
    catch (e) {
        console.error(e);
    }
    try {
        if (bitcoin.payments.p2tr({
            pubkey: pubkeyBuffer,
            network: bitcoinNetwork
        }).address === address)
            return "p2tr";
    }
    catch (e) {
        console.error(e);
    }
    try {
        if (bitcoin.payments.p2sh({
            redeem: bitcoin.payments.p2wpkh({ pubkey: pubkeyBuffer, network: bitcoinNetwork }),
            network: bitcoinNetwork
        }).address === address)
            return "p2sh-p2wpkh";
    }
    catch (e) {
        console.error(e);
    }
    return null;
}
export class SatsConnectBitcoinWallet extends BitcoinWallet {
    constructor(account, walletName, iconUrl) {
        super();
        this.account = account;
        this.walletName = walletName;
        this.iconUrl = iconUrl;
        this.addressType = identifyAddressType(account.address);
    }
    static async isInstalled() {
        let success = false;
        for (let i = 0; i < 10; i++) {
            try {
                await getCapabilities({
                    onFinish(response) {
                        console.log("Capabilities: ", response);
                    },
                    onCancel() {
                        console.log("User cancelled!");
                    },
                    payload: {
                        network: {
                            type: network
                        },
                    },
                });
                success = true;
                break;
            }
            catch (e) {
                success = false;
                console.error(e);
                await new Promise((resolve) => setTimeout(resolve, 200));
            }
        }
        return success;
    }
    static async init(walletName, iconUrl, constructor, _data) {
        if (_data != null) {
            const data = _data;
            return new constructor(data.account, walletName, iconUrl);
        }
        let result = null;
        let cancelled = false;
        await getAddress({
            payload: {
                purposes: [AddressPurpose.Payment],
                message: "Connect your Bitcoin wallet to atomiq.exchange",
                network: {
                    type: network
                },
            },
            onFinish: (_result) => {
                result = _result;
            },
            onCancel: () => { cancelled = true; }
        });
        if (cancelled)
            throw new Error("User declined the connection request");
        if (result == null)
            throw new Error("Xverse bitcoin wallet not found");
        const accounts = result.addresses;
        console.log("Loaded wallet accounts: ", accounts);
        const paymentAccounts = accounts.filter(e => e.purpose === AddressPurpose.Payment);
        if (paymentAccounts.length === 0)
            throw new Error("No valid payment account found");
        BitcoinWallet.saveState(walletName, {
            account: paymentAccounts[0]
        });
        return new constructor(paymentAccounts[0], walletName, iconUrl);
    }
    getBalance() {
        return ChainUtils.getAddressBalances(this.account.address);
    }
    getReceiveAddress() {
        return this.account.address;
    }
    getSpendableBalance() {
        return this._getSpendableBalance(this.account.address, this.addressType);
    }
    //Workaround for undefined BigInt() convertor in es2020
    toBigInt(num) {
        let sum = 0n;
        for (let i = 0n; i < 53n; i++) {
            if ((num & 0b1) === 0b1) {
                sum |= 1n << i;
            }
            num = Math.floor(num / 2);
        }
        return sum;
    }
    async getTransactionFee(address, amount, feeRate) {
        const { psbt, fee } = await super._getPsbt(this.account.publicKey, this.account.address, this.addressType, address, amount.toNumber(), feeRate);
        if (psbt == null)
            return null;
        return fee;
    }
    async sendTransaction(address, amount, feeRate) {
        const { psbt } = await super._getPsbt(this.account.publicKey, this.account.address, this.addressType, address, amount.toNumber(), feeRate);
        if (psbt == null) {
            throw new Error("Not enough balance!");
        }
        let txId = null;
        let psbtBase64 = null;
        let cancelled = false;
        await signTransaction({
            payload: {
                network: {
                    type: network
                },
                message: "Send a swap transaction",
                psbtBase64: psbt.toBase64(),
                broadcast: true,
                inputsToSign: [{
                        address: this.account.address,
                        signingIndexes: psbt.txInputs.map((e, index) => index)
                    }]
            },
            onFinish: (resp) => {
                console.log("TX signed: ", resp);
                txId = resp.txId;
                psbtBase64 = resp.psbtBase64;
            },
            onCancel: () => { cancelled = true; }
        });
        if (cancelled)
            throw new Error("User declined the transaction request");
        if (txId == null) {
            if (psbtBase64 == null)
                throw new Error("Transaction not properly signed by the wallet!");
            const psbt = bitcoin.Psbt.fromBase64(psbtBase64);
            psbt.finalizeAllInputs();
            const tx = psbt.extractTransaction();
            txId = await ChainUtils.sendTransaction(tx.toHex());
        }
        console.log("signTransaction returned!");
        return txId;
    }
    getName() {
        return this.walletName;
    }
    getIcon() {
        return this.iconUrl;
    }
    offWalletChanged(cbk) {
    }
    onWalletChanged(cbk) {
    }
}

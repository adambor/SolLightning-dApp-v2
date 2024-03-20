import { AddressPurpose, BitcoinNetworkType, getCapabilities, getAddress } from "sats-connect";
import { BitcoinWallet } from "./BitcoinWallet";
import { FEConstants } from "../../FEConstants";
import { ChainUtils } from "sollightning-sdk";
import { signTransaction } from "sats-connect/dist";
import * as bitcoin from "bitcoinjs-lib";
const network = FEConstants.chain === "DEVNET" ? BitcoinNetworkType.Testnet : BitcoinNetworkType.Mainnet;
const bitcoinNetwork = FEConstants.chain === "DEVNET" ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
function identifyAddressType(pubkey, address) {
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
export class XverseBitcoinWallet extends BitcoinWallet {
    constructor(account) {
        super();
        this.account = account;
        this.addressType = identifyAddressType(account.publicKey, account.address);
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
    static async init(_data) {
        if (_data != null) {
            const data = _data;
            return new XverseBitcoinWallet(data.account);
        }
        let result = null;
        let cancelled = false;
        await getAddress({
            payload: {
                purposes: [AddressPurpose.Payment],
                message: "Connect your Xverse wallet to atomiq.exchange",
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
        const paymentAccounts = accounts.filter(e => e.purpose === AddressPurpose.Payment);
        if (paymentAccounts.length === 0)
            throw new Error("No valid payment account found");
        BitcoinWallet.saveState(XverseBitcoinWallet.walletName, {
            account: paymentAccounts[0]
        });
        return new XverseBitcoinWallet(paymentAccounts[0]);
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
                        signingIndexes: psbt.txInputs.map(e => e.index)
                    }]
            },
            onFinish: (resp) => { txId = resp.txId; },
            onCancel: () => { cancelled = true; }
        });
        if (cancelled)
            throw new Error("User declined the transaction request");
        return txId;
    }
    getName() {
        return XverseBitcoinWallet.walletName;
    }
    getIcon() {
        return XverseBitcoinWallet.iconUrl;
    }
}
XverseBitcoinWallet.iconUrl = "wallets/btc/xverse.png";
XverseBitcoinWallet.walletName = "Xverse";

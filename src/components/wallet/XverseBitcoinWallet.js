import { AddressPurpose, BitcoinNetworkType, getCapabilities, getAddress } from "sats-connect";
import { BitcoinWallet } from "./BitcoinWallet";
import { FEConstants } from "../../FEConstants";
import { ChainUtils } from "sollightning-sdk";
import { sendBtcTransaction } from "sats-connect/dist";
const network = FEConstants.chain === "DEVNET" ? BitcoinNetworkType.Testnet : BitcoinNetworkType.Mainnet;
export class XverseBitcoinWallet extends BitcoinWallet {
    constructor(account) {
        super();
        this.account = account;
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
    async sendTransaction(address, amount) {
        console.log("XVERSE recipient: " + address + " amount: ", amount.toNumber());
        let txId = null;
        let cancelled = false;
        await sendBtcTransaction({
            payload: {
                network: {
                    type: network
                },
                recipients: [
                    {
                        address,
                        amountSats: this.toBigInt(amount.toNumber())
                    }
                ],
                senderAddress: this.account.address
            },
            onFinish: (_txId) => { txId = _txId; },
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

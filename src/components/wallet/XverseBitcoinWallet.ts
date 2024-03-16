import * as BN from "bn.js";
import {Address, AddressPurpose, BitcoinNetworkType, GetAddressResponse, getCapabilities, getAddress} from "sats-connect";
import {BitcoinWallet} from "./BitcoinWallet";
import {FEConstants} from "../../FEConstants";
import {ChainUtils} from "sollightning-sdk";
import {sendBtcTransaction} from "sats-connect/dist";

const network = FEConstants.chain==="DEVNET" ? BitcoinNetworkType.Testnet : BitcoinNetworkType.Mainnet;

export class XverseBitcoinWallet extends BitcoinWallet {

    static iconUrl: string = "wallets/btc/xverse.png";
    static walletName: string = "Xverse";

    readonly account: Address;

    constructor(account: Address) {
        super();
        this.account = account;
    }

    static async isInstalled(): Promise<boolean> {
        let success = false;
        for(let i=0;i<10;i++) {
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
            } catch (e) {
                success = false;
                console.error(e);
                await new Promise((resolve) => setTimeout(resolve, 200));
            }
        }
        return success;
    }

    static async init(): Promise<XverseBitcoinWallet> {
        let result: GetAddressResponse = null;
        let cancelled: boolean = false;
        await getAddress({
            payload: {
                purposes: [AddressPurpose.Payment],
                message: "Connect your Xverse wallet to atomiq.exchange",
                network: {
                    type: network
                },
            },
            onFinish: (_result: GetAddressResponse) => {
                result = _result;
            },
            onCancel: () => {cancelled = true}
        });

        if(cancelled) throw new Error("User declined the connection request");

        if(result==null) throw new Error("Xverse bitcoin wallet not found");
        const accounts: Address[] = result.addresses;
        const paymentAccounts = accounts.filter(e => e.purpose===AddressPurpose.Payment);
        if(paymentAccounts.length===0) throw new Error("No valid payment account found");

        return new XverseBitcoinWallet(paymentAccounts[0]);
    }

    getBalance(): Promise<{ confirmedBalance: BN; unconfirmedBalance: BN }> {
        return ChainUtils.getAddressBalances(this.account.address);
    }

    getReceiveAddress(): string {
        return this.account.address;
    }

    toBigInt(num: number): bigint {
        let sum: bigint = 0n;
        for(let i=0n;i<53n;i++) {
            if((num & 0b1)===0b1) {
                sum |= 1n << i;
            }
            num = Math.floor(num/2);
        }
        return sum;
    }

    async sendTransaction(address: string, amount: BN): Promise<string> {
        console.log("XVERSE recipient: "+address+" amount: ", amount.toNumber());
        let txId: string = null;
        let cancelled: boolean = false;
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
            onFinish: (_txId: string) => {txId = _txId},
            onCancel: () => {cancelled = true}
        });

        if(cancelled) throw new Error("User declined the transaction request");

        return txId;
    }

    getName(): string {
        return XverseBitcoinWallet.walletName;
    }

    getIcon(): string {
        return XverseBitcoinWallet.iconUrl;
    }

}
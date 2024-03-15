import * as BN from "bn.js";
import {FEConstants} from "../../FEConstants";
import {CoinselectAddressTypes} from "./coinselect2/utils";
import {coinSelect} from "./coinselect2";
import * as bitcoin from "bitcoinjs-lib";
import {ChainUtils} from "sollightning-sdk";

export abstract class BitcoinWallet {

    protected async _getPsbt(
        sendingAddress: string,
        sendingAddressType: CoinselectAddressTypes,
        address: string,
        amount: number
    ): Promise<bitcoin.Psbt> {
        const feeRate = await ChainUtils.getFees();

        const bitcoinNetwork = FEConstants.chain==="DEVNET" ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

        const utxos = await ChainUtils.getAddressUTXOs(sendingAddress);

        let totalSpendable = 0;

        const outputScript = bitcoin.address.toOutputScript(sendingAddress, bitcoinNetwork);

        const utxoPool: {
            vout: number,
            txId: string,
            value: number,
            type: CoinselectAddressTypes,
            outputScript: Buffer,
            address: string
        }[] = utxos.map(utxo => {
            const value = utxo.value.toNumber();
            totalSpendable += value;
            return {
                vout: utxo.vout,
                txId: utxo.txId,
                value: value,
                type: sendingAddressType,
                outputScript: outputScript,
                address: sendingAddress
            };
        });

        console.log("Total spendable value: "+totalSpendable+" num utxos: "+utxoPool.length);

        const targets = [
            {
                address: address,
                value: amount,
                script: bitcoin.address.toOutputScript(address, bitcoinNetwork)
            }
        ];

        let coinselectResult = coinSelect(utxoPool, targets, feeRate.fastestFee, sendingAddressType);

        if(coinselectResult.inputs==null || coinselectResult.outputs==null) {
            return null;
        }

        const psbt = new bitcoin.Psbt();

        psbt.addInputs(coinselectResult.inputs.map(input => {
            return {
                hash: input.txId,
                index: input.vout,
                witnessUtxo: {
                    script: input.outputScript,
                    value: input.value
                },
                sighashType: 0x01
            };
        }));

        psbt.addOutput({
            script: bitcoin.address.toOutputScript(address, bitcoinNetwork),
            value: amount
        });

        if(coinselectResult.outputs.length>1) {
            psbt.addOutput({
                script: outputScript,
                value: coinselectResult.outputs[1].value
            });
        }

        return psbt;
    }

    abstract sendTransaction(address: string, amount: BN): Promise<string>;
    abstract getReceiveAddress(): string;
    abstract getBalance(): Promise<{
        confirmedBalance: BN,
        unconfirmedBalance: BN
    }>;

    abstract getName(): string;
    abstract getIcon(): string;

}
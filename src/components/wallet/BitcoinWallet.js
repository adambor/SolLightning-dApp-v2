import * as BN from "bn.js";
import { FEConstants } from "../../FEConstants";
import { coinSelect, maxSendable } from "./coinselect2";
import * as bitcoin from "bitcoinjs-lib";
import { ChainUtils } from "sollightning-sdk";
import { randomBytes } from "crypto-browserify";
const bitcoinNetwork = FEConstants.chain === "DEVNET" ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
export class BitcoinWallet {
    async _getUtxoPool(sendingAddress, sendingAddressType) {
        const utxos = await ChainUtils.getAddressUTXOs(sendingAddress);
        let totalSpendable = 0;
        const outputScript = bitcoin.address.toOutputScript(sendingAddress, bitcoinNetwork);
        const utxoPool = [];
        for (let utxo of utxos) {
            const value = utxo.value.toNumber();
            totalSpendable += value;
            utxoPool.push({
                vout: utxo.vout,
                txId: utxo.txid,
                value: value,
                type: sendingAddressType,
                outputScript: outputScript,
                address: sendingAddress,
                cpfp: !utxo.status.confirmed ? await ChainUtils.getCPFPData(utxo.txid).then((result) => {
                    if (result.effectiveFeePerVsize == null)
                        return null;
                    return {
                        txVsize: result.adjustedVsize,
                        txEffectiveFeeRate: result.effectiveFeePerVsize
                    };
                }) : null
            });
        }
        console.log("Total spendable value: " + totalSpendable + " num utxos: " + utxoPool.length);
        return utxoPool;
    }
    async _getPsbt(sendingPubkey, sendingAddress, sendingAddressType, address, amount, feeRate) {
        if (feeRate == null)
            feeRate = (await ChainUtils.getFees()).fastestFee;
        const utxoPool = await this._getUtxoPool(sendingAddress, sendingAddressType);
        const targets = [
            {
                address: address,
                value: amount,
                script: bitcoin.address.toOutputScript(address, bitcoinNetwork)
            }
        ];
        let coinselectResult = coinSelect(utxoPool, targets, feeRate, sendingAddressType);
        if (coinselectResult.inputs == null || coinselectResult.outputs == null) {
            return {
                psbt: null,
                fee: coinselectResult.fee
            };
        }
        const psbt = new bitcoin.Psbt({
            network: bitcoinNetwork
        });
        console.log("Inputs: ", coinselectResult.inputs);
        psbt.addInputs(await Promise.all(coinselectResult.inputs.map(async (input) => {
            switch (sendingAddressType) {
                case "p2wpkh":
                    return {
                        hash: input.txId,
                        index: input.vout,
                        witnessUtxo: {
                            script: input.outputScript,
                            value: input.value
                        },
                        sighashType: 0x01
                    };
                case "p2sh-p2wpkh":
                    return {
                        hash: input.txId,
                        index: input.vout,
                        witnessUtxo: {
                            script: input.outputScript,
                            value: input.value
                        },
                        redeemScript: bitcoin.payments.p2wpkh({ pubkey: Buffer.from(sendingPubkey, "hex"), network: bitcoinNetwork }).output,
                        sighashType: 0x01
                    };
                case "p2pkh":
                    return {
                        hash: input.txId,
                        index: input.vout,
                        nonWitnessUtxo: await ChainUtils.getRawTransaction(input.txId),
                        sighashType: 0x01
                    };
            }
        })));
        psbt.addOutput({
            script: bitcoin.address.toOutputScript(address, bitcoinNetwork),
            value: amount
        });
        if (coinselectResult.outputs.length > 1) {
            psbt.addOutput({
                script: bitcoin.address.toOutputScript(sendingAddress, bitcoinNetwork),
                value: coinselectResult.outputs[1].value
            });
        }
        return {
            psbt,
            fee: coinselectResult.fee
        };
    }
    async _getSpendableBalance(sendingAddress, sendingAddressType) {
        const feeRate = await ChainUtils.getFees();
        const utxoPool = await this._getUtxoPool(sendingAddress, sendingAddressType);
        console.log("Utxo pool: ", utxoPool);
        const target = bitcoin.payments.p2wsh({
            hash: randomBytes(32),
            network: FEConstants.chain === "DEVNET" ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
        });
        let coinselectResult = maxSendable(utxoPool, target.output, "p2wsh", feeRate.fastestFee);
        console.log("Max spendable result: ", coinselectResult);
        return {
            feeRate: feeRate.fastestFee,
            balance: new BN(coinselectResult.value),
            totalFee: coinselectResult.fee
        };
    }
    static loadState() {
        const txt = localStorage.getItem("btc-wallet");
        if (txt == null)
            return null;
        try {
            return JSON.parse(localStorage.getItem("btc-wallet"));
        }
        catch (e) {
            console.error(e);
            return null;
        }
    }
    static saveState(name, data) {
        localStorage.setItem("btc-wallet", JSON.stringify({
            name,
            data
        }));
    }
    static clearState() {
        localStorage.removeItem("btc-wallet");
    }
}

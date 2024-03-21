import {accumulative} from "./accumulative"
import {blackjack} from "./blackjack"
import {CoinselectAddressTypes, CoinselectTxInput, CoinselectTxOutput, DUST_THRESHOLDS, utils} from "./utils"


// order by descending value, minus the inputs approximate fee
function utxoScore (x, feeRate) {
    return x.value - (feeRate * utils.inputBytes(x))
}

export function coinSelect (
    utxos: CoinselectTxInput[],
    outputs: CoinselectTxOutput[],
    feeRate: number,
    type: CoinselectAddressTypes,
): {
    inputs?: CoinselectTxInput[],
    outputs?: CoinselectTxOutput[],
    fee: number
} {
    utxos = utxos.sort((a, b) => utxoScore(b, feeRate) - utxoScore(a, feeRate));

    // attempt to use the blackjack strategy first (no change output)
    const base = blackjack(utxos, outputs, feeRate, type);
    if (base.inputs) return base;

    // else, try the accumulative strategy
    return accumulative(utxos, outputs, feeRate, type);
}

export function maxSendable (
    utxos: CoinselectTxInput[],
    outputScript: Buffer,
    outputType: CoinselectAddressTypes,
    feeRate: number,
): {
    value: number,
    fee: number
} {
    if (!isFinite(utils.uintOrNaN(feeRate))) return null;

    let bytesAccum = utils.transactionBytes([], [{script: outputScript}], null);
    let inAccum = 0;
    const inputs = [];

    for (let i = 0; i < utxos.length; ++i) {
        const utxo = utxos[i];
        const utxoBytes = utils.inputBytes(utxo);
        const utxoFee = feeRate * utxoBytes;
        const utxoValue = utils.uintOrNaN(utxo.value);

        // skip detrimental input
        if (utxoFee > utxo.value) {
            continue;
        }

        bytesAccum += utxoBytes;
        inAccum += utxoValue;
        inputs.push(utxo);
    }

    const fee = feeRate * bytesAccum;
    const outputValue = inAccum - fee;

    const dustThreshold = DUST_THRESHOLDS[outputType];

    if(outputValue<dustThreshold) return {
        fee,
        value: 0
    };

    return {
        fee,
        value: outputValue
    };
}

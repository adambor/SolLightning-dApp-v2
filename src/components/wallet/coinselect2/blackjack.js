import { utils } from "./utils";
// add inputs until we reach or surpass the target value (or deplete)
// worst-case: O(n)
export function blackjack(utxos, outputs, feeRate, type) {
    if (!isFinite(utils.uintOrNaN(feeRate)))
        return null;
    let bytesAccum = utils.transactionBytes([], outputs, type);
    let inAccum = 0;
    const inputs = [];
    const outAccum = utils.sumOrNaN(outputs);
    const threshold = utils.dustThreshold({ type });
    for (let i = 0; i < utxos.length; ++i) {
        const input = utxos[i];
        const inputBytes = utils.inputBytes(input);
        const fee = feeRate * (bytesAccum + inputBytes);
        const inputValue = utils.uintOrNaN(input.value);
        // would it waste value?
        if ((inAccum + inputValue) > (outAccum + fee + threshold))
            continue;
        bytesAccum += inputBytes;
        inAccum += inputValue;
        inputs.push(input);
        // go again?
        if (inAccum < outAccum + fee)
            continue;
        return utils.finalize(inputs, outputs, feeRate, type);
    }
    return { fee: feeRate * bytesAccum };
}

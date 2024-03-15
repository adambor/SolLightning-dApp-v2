// baseline estimates, used to improve performance
const TX_EMPTY_SIZE = 4 + 1 + 1 + 4;
const TX_INPUT_BASE = 32 + 4 + 1 + 4;
const WITNESS_OVERHEAD = 2 / 4;
const P2WPKH_WITNESS = (1 + 1 + 72 + 1 + 33) / 4;
const P2TR_WITNESS = (1 + 1 + 65) / 4;
const TX_INPUT_PUBKEYHASH = 107;
const TX_INPUT_P2SH_P2WPKH = 23 + P2WPKH_WITNESS + 1;
const TX_INPUT_P2WPKH = 0 + P2WPKH_WITNESS;
const TX_INPUT_P2WSH = 0 + (1 + 1 + 64) / 4;
const TX_INPUT_P2TR = 0 + P2TR_WITNESS;
const TX_OUTPUT_BASE = 8 + 1;
const TX_OUTPUT_PUBKEYHASH = 25;
const TX_OUTPUT_P2SH_P2WPKH = 23;
const TX_OUTPUT_P2WPKH = 22;
const TX_OUTPUT_P2WSH = 34;
const TX_OUTPUT_P2TR = 34;
const INPUT_BYTES = {
    "p2sh-p2wpkh": TX_INPUT_P2SH_P2WPKH,
    "p2wpkh": TX_INPUT_P2WPKH,
    "p2tr": TX_INPUT_P2TR,
    "p2pkh": TX_INPUT_PUBKEYHASH,
    "p2wsh": TX_INPUT_P2WSH
};
function inputBytes(input) {
    return TX_INPUT_BASE + (input.script ? input.script.length : INPUT_BYTES[input.type]);
}
const OUTPUT_BYTES = {
    "p2sh-p2wpkh": TX_OUTPUT_P2SH_P2WPKH,
    "p2wpkh": TX_OUTPUT_P2WPKH,
    "p2tr": TX_OUTPUT_P2TR,
    "p2pkh": TX_OUTPUT_PUBKEYHASH,
    "p2wsh": TX_OUTPUT_P2WSH
};
function outputBytes(output) {
    return TX_OUTPUT_BASE + (output.script ? output.script.length : OUTPUT_BYTES[output.type]);
}
const DUST_THRESHOLDS = {
    "p2sh-p2wpkh": 540,
    "p2wpkh": 294,
    "p2tr": 330,
    "p2pkh": 546,
    "p2wsh": 330
};
function dustThreshold(output) {
    return DUST_THRESHOLDS[output.type];
}
function transactionBytes(inputs, outputs, changeType) {
    let size = TX_EMPTY_SIZE;
    let isSegwit = false;
    if (changeType !== "p2pkh") {
        size += WITNESS_OVERHEAD;
        let isSegwit = true;
    }
    for (let input of inputs) {
        if (!isSegwit && (input.type !== "p2pkh")) {
            isSegwit = true;
            size += WITNESS_OVERHEAD;
        }
        size += inputBytes(input);
    }
    for (let output of outputs) {
        size += outputBytes(output);
    }
    return Math.ceil(size);
}
function uintOrNaN(v) {
    if (typeof v !== 'number')
        return NaN;
    if (!isFinite(v))
        return NaN;
    if (Math.floor(v) !== v)
        return NaN;
    if (v < 0)
        return NaN;
    return v;
}
function sumForgiving(range) {
    return range.reduce((a, x) => a + (isFinite(x.value) ? x.value : 0), 0);
}
function sumOrNaN(range) {
    return range.reduce((a, x) => a + uintOrNaN(x.value), 0);
}
function finalize(inputs, outputs, feeRate, changeType) {
    const bytesAccum = transactionBytes(inputs, outputs, changeType);
    const feeAfterExtraOutput = feeRate * (bytesAccum + outputBytes({ type: changeType }));
    const remainderAfterExtraOutput = sumOrNaN(inputs) - (sumOrNaN(outputs) + feeAfterExtraOutput);
    // is it worth a change output?
    if (remainderAfterExtraOutput >= dustThreshold({ type: changeType })) {
        outputs = outputs.concat({ value: remainderAfterExtraOutput, type: changeType });
    }
    const fee = sumOrNaN(inputs) - sumOrNaN(outputs);
    if (!isFinite(fee))
        return { fee: feeRate * bytesAccum };
    return {
        inputs: inputs,
        outputs: outputs,
        fee: fee
    };
}
export const utils = {
    dustThreshold: dustThreshold,
    finalize: finalize,
    inputBytes: inputBytes,
    outputBytes: outputBytes,
    sumOrNaN: sumOrNaN,
    sumForgiving: sumForgiving,
    transactionBytes: transactionBytes,
    uintOrNaN: uintOrNaN
};

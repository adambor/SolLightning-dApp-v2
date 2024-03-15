import { accumulative } from "./accumulative";
import { blackjack } from "./blackjack";
import { utils } from "./utils";
// order by descending value, minus the inputs approximate fee
function utxoScore(x, feeRate) {
    return x.value - (feeRate * utils.inputBytes(x));
}
export function coinSelect(utxos, outputs, feeRate, type) {
    utxos = utxos.sort((a, b) => utxoScore(b, feeRate) - utxoScore(a, feeRate));
    // attempt to use the blackjack strategy first (no change output)
    const base = blackjack(utxos, outputs, feeRate, type);
    if (base.inputs)
        return base;
    // else, try the accumulative strategy
    return accumulative(utxos, outputs, feeRate, type);
}

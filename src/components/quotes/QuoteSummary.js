import { jsx as _jsx } from "react/jsx-runtime";
import { FromBTCLNSwap, FromBTCSwap, IFromBTCSwap, IToBTCSwap } from "sollightning-sdk";
import { ToBTCQuoteSummary } from "./tobtc/ToBTCQuoteSummary";
import { LNURLWithdrawQuoteSummary } from "./frombtc/LNURLWithdrawQuoteSummary";
import { FromBTCLNQuoteSummary } from "./frombtc/FromBTCLNQuoteSummary";
import { FromBTCQuoteSummary } from "./frombtc/FromBTCQuoteSummary";
import * as BN from "bn.js";
import { useEffect, useState } from "react";
//The getBalance automatically discounts the WSOL ATA deposit + commit fee (including deposit for EscrowState)
const minNativeTokenBalance = new BN(500000);
export function QuoteSummary(props) {
    const [notEnoughForGas, setNotEnoughForGas] = useState(false);
    useEffect(() => {
        setNotEnoughForGas(false);
        //Check if the user has enough lamports to cover solana transaction fees
        const swapContract = props.swapper.swapContract;
        swapContract.getBalance(swapContract.getNativeCurrencyAddress(), false).then(balance => {
            console.log("NATIVE balance: ", balance.toString(10));
            if (balance.lt(minNativeTokenBalance)) {
                setNotEnoughForGas(true);
            }
        });
    }, [props.quote]);
    if (props.quote instanceof IToBTCSwap)
        return _jsx(ToBTCQuoteSummary, { type: props.type, setAmountLock: props.setAmountLock, quote: props.quote, refreshQuote: props.refreshQuote, balance: props.balance, autoContinue: props.autoContinue, notEnoughForGas: notEnoughForGas });
    if (props.quote instanceof IFromBTCSwap) {
        if (props.quote instanceof FromBTCLNSwap) {
            if (props.quote.lnurl != null && props.type !== "swap") {
                return _jsx(LNURLWithdrawQuoteSummary, { type: props.type, setAmountLock: props.setAmountLock, quote: props.quote, refreshQuote: props.refreshQuote, autoContinue: props.autoContinue, notEnoughForGas: notEnoughForGas });
            }
            else {
                return _jsx(FromBTCLNQuoteSummary, { swapper: props.swapper, type: props.type, setAmountLock: props.setAmountLock, quote: props.quote, refreshQuote: props.refreshQuote, abortSwap: props.abortSwap, notEnoughForGas: notEnoughForGas });
            }
        }
        if (props.quote instanceof FromBTCSwap)
            return _jsx(FromBTCQuoteSummary, { type: props.type, setAmountLock: props.setAmountLock, quote: props.quote, refreshQuote: props.refreshQuote, abortSwap: props.abortSwap, notEnoughForGas: notEnoughForGas, balance: props.balance, feeRate: props.feeRate });
    }
}

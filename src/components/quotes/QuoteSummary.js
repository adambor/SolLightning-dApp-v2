import { jsx as _jsx } from "react/jsx-runtime";
import { FromBTCLNSwap, FromBTCSwap, IFromBTCSwap, IToBTCSwap } from "sollightning-sdk";
import { ToBTCQuoteSummary } from "./tobtc/ToBTCQuoteSummary";
import { LNURLWithdrawQuoteSummary } from "./frombtc/LNURLWithdrawQuoteSummary";
import { FromBTCLNQuoteSummary } from "./frombtc/FromBTCLNQuoteSummary";
import { FromBTCQuoteSummary } from "./frombtc/FromBTCQuoteSummary";
export function QuoteSummary(props) {
    if (props.quote instanceof IToBTCSwap)
        return _jsx(ToBTCQuoteSummary, { type: props.type, setAmountLock: props.setAmountLock, quote: props.quote, refreshQuote: props.refreshQuote, balance: props.balance, autoContinue: props.autoContinue });
    if (props.quote instanceof IFromBTCSwap) {
        if (props.quote instanceof FromBTCLNSwap) {
            if (props.quote.lnurl != null && props.type !== "swap") {
                return _jsx(LNURLWithdrawQuoteSummary, { type: props.type, setAmountLock: props.setAmountLock, quote: props.quote, refreshQuote: props.refreshQuote, autoContinue: props.autoContinue });
            }
            else {
                return _jsx(FromBTCLNQuoteSummary, { swapper: props.swapper, type: props.type, setAmountLock: props.setAmountLock, quote: props.quote, refreshQuote: props.refreshQuote, abortSwap: props.abortSwap });
            }
        }
        if (props.quote instanceof FromBTCSwap)
            return _jsx(FromBTCQuoteSummary, { type: props.type, setAmountLock: props.setAmountLock, quote: props.quote, refreshQuote: props.refreshQuote, abortSwap: props.abortSwap });
    }
}

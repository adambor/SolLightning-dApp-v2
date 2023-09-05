import {FromBTCLNSwap, FromBTCLNSwapState, FromBTCSwap, FromBTCSwapState, IFromBTCSwap, ISwap, IToBTCSwap} from "sollightning-sdk";
import {ToBTCQuoteSummary} from "./tobtc/ToBTCQuoteSummary";
import {LNURLWithdrawQuoteSummary} from "./frombtc/LNURLWithdrawQuoteSummary";
import {FromBTCLNQuoteSummary} from "./frombtc/FromBTCLNQuoteSummary";
import {FromBTCQuoteSummary} from "./frombtc/FromBTCQuoteSummary";
import * as React from "react";

export function QuoteSummary(props: {
    quote: ISwap,
    refreshQuote: () => void,
    setAmountLock?: (isLocked: boolean) => void,
    type?: "payment" | "swap",
    abortSwap?: () => void
}) {

    if(props.quote instanceof IToBTCSwap) return <ToBTCQuoteSummary type={props.type} setAmountLock={props.setAmountLock} quote={props.quote} refreshQuote={props.refreshQuote}/>;
    if(props.quote instanceof IFromBTCSwap) {
        if(props.quote instanceof FromBTCLNSwap) {
            if(props.quote.lnurl!=null) {
                return <LNURLWithdrawQuoteSummary type={props.type} setAmountLock={props.setAmountLock} quote={props.quote} refreshQuote={props.refreshQuote}/>;
            } else {
                return <FromBTCLNQuoteSummary type={props.type} setAmountLock={props.setAmountLock} quote={props.quote} refreshQuote={props.refreshQuote} abortSwap={props.abortSwap}/>;
            }
        }
        if(props.quote instanceof FromBTCSwap) return <FromBTCQuoteSummary type={props.type} setAmountLock={props.setAmountLock} quote={props.quote} refreshQuote={props.refreshQuote} abortSwap={props.abortSwap}/>;
    }

}
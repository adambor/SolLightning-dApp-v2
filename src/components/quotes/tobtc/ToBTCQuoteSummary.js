import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Alert, Button, ProgressBar, Spinner } from "react-bootstrap";
import { ToBTCLNSwap, ToBTCSwapState } from "sollightning-sdk";
import { getCurrencySpec, toHumanReadableString } from "../../../utils/Currencies";
import * as bolt11 from "bolt11";
const SNOWFLAKE_LIST = new Set([
    "038f8f113c580048d847d6949371726653e02b928196bad310e3eda39ff61723f6",
    "03a6ce61fcaacd38d31d4e3ce2d506602818e3856b4b44faff1dde9642ba705976"
]);
export function ToBTCQuoteSummary(props) {
    const [quoteTimeRemaining, setQuoteTimeRemaining] = useState();
    const [initialQuoteTimeout, setInitialQuoteTimeout] = useState();
    const expiryTime = useRef();
    const [confidenceWarning, setConfidenceWarning] = useState(false);
    const [loading, setLoading] = useState();
    const [success, setSuccess] = useState();
    const [refund, setRefund] = useState();
    const [error, setError] = useState();
    const [refunding, setRefunding] = useState();
    const [refunded, setRefunded] = useState();
    const onContinue = async (skipChecks) => {
        setLoading(true);
        try {
            if (props.setAmountLock)
                props.setAmountLock(true);
            await props.quote.commit(null, null, skipChecks);
            const success = await props.quote.waitForPayment();
            if (success) {
                setSuccess(true);
                if (props.setAmountLock)
                    props.setAmountLock(false);
            }
            else {
                setSuccess(false);
                setRefund(true);
                setError("Swap failed, you can refund your prior deposit");
            }
        }
        catch (e) {
            setSuccess(false);
            setError(e.toString());
            if (props.setAmountLock)
                props.setAmountLock(false);
        }
        setLoading(false);
    };
    const onRefund = async () => {
        setRefunding(true);
        try {
            await props.quote.refund();
            setRefunded(true);
            setError("Deposit refunded successfully");
            if (props.setAmountLock)
                props.setAmountLock(false);
        }
        catch (e) {
        }
        setRefunding(false);
    };
    useEffect(() => {
        if (props.quote == null)
            return () => { };
        let cancelled = false;
        if (confidenceWarning)
            setConfidenceWarning(false);
        if (props.quote.getState() === ToBTCSwapState.CREATED) {
            if (props.quote instanceof ToBTCLNSwap && props.quote.getConfidence() === 0) {
                let is_snowflake = false;
                if (props.quote.pr != null) {
                    const parsedRequest = bolt11.decode(props.quote.pr);
                    if (parsedRequest.tagsObject.routing_info != null) {
                        for (let route of parsedRequest.tagsObject.routing_info) {
                            if (SNOWFLAKE_LIST.has(route.pubkey)) {
                                is_snowflake = true;
                            }
                        }
                    }
                }
                if (confidenceWarning === is_snowflake)
                    setConfidenceWarning(!is_snowflake);
            }
            //Check that we have enough funds!
            const neededToPay = props.quote.getInAmount();
            let balancePromise;
            if (props.balance != null) {
                balancePromise = Promise.resolve(props.balance);
            }
            else {
                balancePromise = props.quote.getWrapper().getBalance(props.quote.data.getToken());
            }
            balancePromise.then(balance => {
                if (cancelled)
                    return;
                const hasEnoughBalance = balance.gte(neededToPay);
                if (!hasEnoughBalance) {
                    const currency = getCurrencySpec(props.quote.getToken());
                    setSuccess(false);
                    setError("You don't have enough funds to initiate the swap, balance: " + toHumanReadableString(balance, currency) + " " + currency.ticker);
                    setLoading(false);
                    return;
                }
                if (props.autoContinue)
                    onContinue(true);
            });
        }
        setSuccess(null);
        setRefund(false);
        setError(null);
        setRefunding(false);
        setRefunded(false);
        let interval;
        interval = setInterval(() => {
            let dt = expiryTime.current - Date.now();
            if (dt <= 0) {
                clearInterval(interval);
                dt = 0;
            }
            setQuoteTimeRemaining(Math.floor(dt / 1000));
        }, 500);
        expiryTime.current = props.quote.getExpiry();
        const dt = Math.floor((expiryTime.current - Date.now()) / 1000);
        setInitialQuoteTimeout(dt);
        setQuoteTimeRemaining(dt);
        return () => {
            clearInterval(interval);
            cancelled = true;
        };
    }, [props.quote]);
    return (_jsxs(_Fragment, { children: [_jsxs(Alert, Object.assign({ className: "text-center mb-3", show: confidenceWarning, variant: "warning", onClose: () => setConfidenceWarning(false), dismissible: true, closeVariant: "white" }, { children: [_jsx("strong", { children: "Payment might likely fail!" }), _jsx("label", { children: "We weren't able to check if the recipient is reachable (send probe request) on the Lightning network, this is common with some wallets, but could also indicate that the destination is unreachable and payment might therefore fail (you will get a refund in that case)!" })] })), _jsxs("div", Object.assign({ className: success === null && !loading ? "d-flex flex-column mb-3 tab-accent" : "d-none" }, { children: [quoteTimeRemaining === 0 ? (_jsx("label", { children: "Quote expired!" })) : (_jsxs("label", { children: ["Quote expires in ", quoteTimeRemaining, " seconds"] })), _jsx(ProgressBar, { animated: true, now: quoteTimeRemaining, max: initialQuoteTimeout, min: 0 })] })), success === null ? (quoteTimeRemaining === 0 && !loading ? (_jsx(Button, Object.assign({ onClick: props.refreshQuote, variant: "secondary" }, { children: "New quote" }))) : (_jsxs(Button, Object.assign({ onClick: () => onContinue(), disabled: loading, size: "lg" }, { children: [loading ? _jsx(Spinner, { animation: "border", size: "sm", className: "mr-2" }) : "", props.type === "payment" ? "Pay" : "Swap"] })))) : (success ? (_jsxs(Alert, Object.assign({ variant: "success", className: "mb-0" }, { children: [_jsx("strong", { children: "Swap successful" }), _jsx("label", { children: "Swap was concluded successfully" })] }))) : (_jsxs(_Fragment, { children: [_jsxs(Alert, Object.assign({ variant: "danger", className: "mb-3" }, { children: [_jsx("strong", { children: "Swap failed" }), _jsx("label", { children: error })] })), refund ? (_jsxs(Button, Object.assign({ onClick: onRefund, className: refunded ? "d-none" : "", disabled: refunding, variant: "secondary" }, { children: [refunding ? _jsx(Spinner, { animation: "border", size: "sm", className: "mr-2" }) : "", "Refund deposit"] }))) : (_jsx(Button, Object.assign({ onClick: props.refreshQuote, variant: "secondary" }, { children: "New quote" })))] })))] }));
}

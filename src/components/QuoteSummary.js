import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Alert, Button, ProgressBar, Spinner } from "react-bootstrap";
import { FromBTCLNSwap, FromBTCLNSwapState, FromBTCSwap, FromBTCSwapState, IFromBTCSwap, IToBTCSwap } from "sollightning-sdk";
import { QRCodeSVG } from 'qrcode.react';
import { btcCurrency, toHumanReadableString } from "../utils/Currencies";
import ValidatedInput from "./ValidatedInput";
function FromBTCQuoteSummary(props) {
    const [state, setState] = useState(null);
    const [quoteTimeRemaining, setQuoteTimeRemaining] = useState();
    const [initialQuoteTimeout, setInitialQuoteTimeout] = useState();
    const expiryTime = useRef();
    const [loading, setLoading] = useState();
    const [success, setSuccess] = useState();
    const [error, setError] = useState();
    const [txData, setTxData] = useState(null);
    useEffect(() => {
        if (props.quote == null)
            return () => { };
        setSuccess(null);
        setError(null);
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
        let listener;
        const abortController = new AbortController();
        let paymentSubscribed = false;
        // setState(props.quote.getState());
        setState(FromBTCSwapState.CLAIM_COMMITED);
        setTxData({
            txId: "c2a779af671bccd5d0b17e4327a2aefbf465eb39097f0b2a7c702689dbfa09b2",
            confirmations: 0,
            confTarget: 2
        });
        props.quote.events.on("swapState", listener = (quote) => {
            setState(quote.getState());
            if (quote.getState() === FromBTCSwapState.CLAIM_COMMITED) {
                if (!paymentSubscribed)
                    props.quote.waitForPayment(abortController.signal, null, (txId, confirmations, confirmationTarget) => {
                        setTxData({
                            txId,
                            confirmations,
                            confTarget: confirmationTarget
                        });
                    });
                paymentSubscribed = true;
            }
            if (quote.getState() === FromBTCSwapState.CLAIM_CLAIMED) {
                if (props.setAmountLock)
                    props.setAmountLock(false);
            }
        });
        return () => {
            clearInterval(interval);
            props.quote.events.removeListener("swapState", listener);
            abortController.abort();
        };
    }, [props.quote]);
    const onCommit = async () => {
        setLoading(true);
        try {
            if (props.setAmountLock)
                props.setAmountLock(true);
            await props.quote.commit();
        }
        catch (e) {
            if (props.setAmountLock)
                props.setAmountLock(false);
            setError(e.toString());
            expiryTime.current = 0;
            setQuoteTimeRemaining(0);
        }
        setLoading(false);
    };
    const onClaim = async () => {
        setLoading(true);
        try {
            await props.quote.claim();
            setLoading(false);
            setSuccess(true);
        }
        catch (e) {
            setSuccess(false);
            setError(e.toString());
        }
    };
    return (_jsxs(_Fragment, { children: [error != null ? (_jsxs(Alert, Object.assign({ variant: "danger", className: "mb-3" }, { children: [_jsx("p", { children: _jsx("strong", { children: "Swap failed" }) }), error] }))) : "", state === FromBTCSwapState.PR_CREATED ? (_jsxs(_Fragment, { children: [_jsxs("div", Object.assign({ className: success === null && !loading ? "d-flex flex-column mb-3" : "d-none" }, { children: [quoteTimeRemaining === 0 ? (_jsx("label", { children: "Quote expired!" })) : (_jsxs("label", { children: ["Quote expires in ", quoteTimeRemaining, " seconds"] })), _jsx(ProgressBar, { animated: true, now: quoteTimeRemaining, max: initialQuoteTimeout, min: 0 })] })), quoteTimeRemaining === 0 ? (_jsx(Button, Object.assign({ onClick: props.refreshQuote, variant: "secondary" }, { children: "New quote" }))) : (_jsxs(Button, Object.assign({ onClick: onCommit, disabled: loading, size: "lg" }, { children: [loading ? _jsx(Spinner, { animation: "border", size: "sm", className: "mr-2" }) : "", "Initiate swap"] })))] })) : "", state === FromBTCSwapState.CLAIM_COMMITED ? (txData == null ? (_jsxs(_Fragment, { children: [_jsx(QRCodeSVG, { value: props.quote.getQrData(), size: 300, includeMargin: true }), _jsxs("label", { children: ["Please send exactly ", toHumanReadableString(props.quote.getInAmount(), btcCurrency), " ", btcCurrency.ticker, " to the address"] }), _jsx(ValidatedInput, { type: "text", value: props.quote.getAddress() })] })) : (_jsxs("div", Object.assign({ className: "d-flex flex-column align-items-center" }, { children: [_jsx("label", { children: "Transaction successfully received, waiting for confirmations..." }), _jsx(Spinner, {}), _jsxs("label", { children: [txData.confirmations, " / ", txData.confTarget] }), _jsx("label", { children: "Confirmations" })] })))) : "", state === FromBTCSwapState.BTC_TX_CONFIRMED ? (_jsxs(_Fragment, { children: [_jsx("label", { children: "Transaction received & confirmed" }), _jsxs(Button, Object.assign({ onClick: onClaim, disabled: loading, size: "lg" }, { children: [loading ? _jsx(Spinner, { animation: "border", size: "sm", className: "mr-2" }) : "", "Finish swap (claim funds)"] }))] })) : "", state === FromBTCSwapState.CLAIM_CLAIMED ? (_jsxs(Alert, Object.assign({ variant: "success" }, { children: [_jsx("p", { children: _jsx("strong", { children: "Swap successful" }) }), "Swap was concluded successfully"] }))) : ""] }));
}
function FromBTCLNQuoteSummary(props) {
    const [state, setState] = useState(null);
    const [quoteTimeRemaining, setQuoteTimeRemaining] = useState();
    const [initialQuoteTimeout, setInitialQuoteTimeout] = useState();
    const expiryTime = useRef();
    const [isStarted, setStarted] = useState();
    const [loading, setLoading] = useState();
    const [success, setSuccess] = useState();
    const [error, setError] = useState();
    const abortControllerRef = useRef(new AbortController());
    useEffect(() => {
        abortControllerRef.current = new AbortController();
        if (props.quote == null)
            return () => { };
        setSuccess(null);
        setError(null);
        let interval;
        interval = setInterval(() => {
            let dt = expiryTime.current - Date.now();
            if (dt <= 0) {
                clearInterval(interval);
                dt = 0;
            }
            setQuoteTimeRemaining(Math.floor(dt / 1000));
        }, 500);
        expiryTime.current = Date.now() + (30 * 1000);
        const dt = Math.floor((expiryTime.current - Date.now()) / 1000);
        setInitialQuoteTimeout(dt);
        setQuoteTimeRemaining(dt);
        let listener;
        setState(props.quote.getState());
        // setState(FromBTCLNSwapState.PR_CREATED);
        props.quote.events.on("swapState", listener = (quote) => {
            setState(quote.getState());
            if (quote.getState() === FromBTCLNSwapState.CLAIM_CLAIMED) {
                if (props.setAmountLock)
                    props.setAmountLock(false);
            }
            if (quote.getState() === FromBTCLNSwapState.PR_PAID) {
                clearInterval(interval);
                interval = setInterval(() => {
                    let dt = expiryTime.current - Date.now();
                    if (dt <= 0) {
                        clearInterval(interval);
                        dt = 0;
                        if (props.setAmountLock != null)
                            props.setAmountLock(false);
                    }
                    setQuoteTimeRemaining(Math.floor(dt / 1000));
                }, 500);
                expiryTime.current = quote.getExpiry();
                const dt = Math.floor((expiryTime.current - Date.now()) / 1000);
                setInitialQuoteTimeout(dt);
                setQuoteTimeRemaining(dt);
            }
        });
        return () => {
            clearInterval(interval);
            props.quote.events.removeListener("swapState", listener);
            abortControllerRef.current.abort();
        };
    }, [props.quote]);
    const onCommit = async () => {
        setStarted(true);
        if (props.setAmountLock != null)
            props.setAmountLock(true);
        props.quote.waitForPayment(abortControllerRef.current.signal);
    };
    const onClaim = async () => {
        setLoading(true);
        try {
            await props.quote.commitAndClaim();
            setLoading(false);
            setSuccess(true);
        }
        catch (e) {
            setSuccess(false);
            setError(e.toString());
        }
    };
    return (_jsxs(_Fragment, { children: [error != null ? (_jsxs(Alert, Object.assign({ variant: "danger", className: "mb-3" }, { children: [_jsx("p", { children: _jsx("strong", { children: "Swap failed" }) }), error] }))) : "", state === FromBTCLNSwapState.PR_CREATED ? (!isStarted ? (_jsxs(_Fragment, { children: [_jsxs("div", Object.assign({ className: success === null && !loading ? "d-flex flex-column mb-3" : "d-none" }, { children: [quoteTimeRemaining === 0 ? (_jsx("label", { children: "Quote expired!" })) : (_jsxs("label", { children: ["Quote expires in ", quoteTimeRemaining, " seconds"] })), _jsx(ProgressBar, { animated: true, now: quoteTimeRemaining, max: initialQuoteTimeout, min: 0 })] })), quoteTimeRemaining === 0 ? (_jsx(Button, Object.assign({ onClick: props.refreshQuote, variant: "secondary" }, { children: "New quote" }))) : (_jsxs(Button, Object.assign({ onClick: onCommit, disabled: loading, size: "lg" }, { children: [loading ? _jsx(Spinner, { animation: "border", size: "sm", className: "mr-2" }) : "", "Initiate swap"] })))] })) : (_jsxs(_Fragment, { children: [_jsx(QRCodeSVG, { value: props.quote.getQrData(), size: 300, includeMargin: true }), _jsx("label", { children: "Please initiate a payment to this lightning network invoice" }), _jsx(ValidatedInput, { type: "text", value: props.quote.getAddress() })] }))) : "", state === FromBTCLNSwapState.PR_PAID || state === FromBTCLNSwapState.CLAIM_COMMITED ? (_jsxs(_Fragment, { children: [quoteTimeRemaining !== 0 ? (_jsxs("div", Object.assign({ className: "mb-3" }, { children: [_jsx("label", { children: "Lightning network payment received" }), _jsx("label", { children: "Claim it below to finish the swap!" })] }))) : "", state === FromBTCLNSwapState.PR_PAID ? (_jsxs("div", Object.assign({ className: success === null && !loading ? "d-flex flex-column mb-3" : "d-none" }, { children: [quoteTimeRemaining === 0 ? (_jsx("label", { children: "Swap expired! Your lightning payment should refund shortly." })) : (_jsxs("label", { children: ["Offer expires in ", quoteTimeRemaining, " seconds"] })), _jsx(ProgressBar, { animated: true, now: quoteTimeRemaining, max: initialQuoteTimeout, min: 0 })] }))) : "", quoteTimeRemaining === 0 ? (_jsx(Button, Object.assign({ onClick: props.refreshQuote, variant: "secondary" }, { children: "New quote" }))) : (_jsxs(Button, Object.assign({ onClick: onClaim, disabled: loading, size: "lg" }, { children: [loading ? _jsx(Spinner, { animation: "border", size: "sm", className: "mr-2" }) : "", "Finish swap (claim funds)"] })))] })) : "", state === FromBTCLNSwapState.CLAIM_CLAIMED ? (_jsxs(Alert, Object.assign({ variant: "success" }, { children: [_jsx("p", { children: _jsx("strong", { children: "Swap successful" }) }), "Swap was concluded successfully"] }))) : ""] }));
}
function ToBTCQuoteSummary(props) {
    const [quoteTimeRemaining, setQuoteTimeRemaining] = useState();
    const [initialQuoteTimeout, setInitialQuoteTimeout] = useState();
    const expiryTime = useRef();
    const [loading, setLoading] = useState();
    const [success, setSuccess] = useState();
    const [refund, setRefund] = useState();
    const [error, setError] = useState();
    const [refunding, setRefunding] = useState();
    const [refunded, setRefunded] = useState();
    useEffect(() => {
        if (props.quote == null)
            return () => { };
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
        };
    }, [props.quote]);
    const onContinue = async () => {
        setLoading(true);
        try {
            const neededToPay = props.quote.getInAmount();
            const balance = await props.quote.getWrapper().getBalance(props.quote.data.getToken());
            const hasEnoughBalance = balance.gte(neededToPay);
            if (!hasEnoughBalance) {
                setSuccess(false);
                setError("Not enough funds to initiate the swap");
                setLoading(false);
                return;
            }
            if (props.setAmountLock)
                props.setAmountLock(true);
            await props.quote.commit();
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
    return (_jsxs(_Fragment, { children: [_jsxs("div", Object.assign({ className: success === null && !loading ? "d-flex flex-column mb-3" : "d-none" }, { children: [quoteTimeRemaining === 0 ? (_jsx("label", { children: "Quote expired!" })) : (_jsxs("label", { children: ["Quote expires in ", quoteTimeRemaining, " seconds"] })), _jsx(ProgressBar, { animated: true, now: quoteTimeRemaining, max: initialQuoteTimeout, min: 0 })] })), success === null ? (quoteTimeRemaining === 0 ? (_jsx(Button, Object.assign({ onClick: props.refreshQuote, variant: "secondary" }, { children: "New quote" }))) : (_jsxs(Button, Object.assign({ onClick: onContinue, disabled: loading, size: "lg" }, { children: [loading ? _jsx(Spinner, { animation: "border", size: "sm", className: "mr-2" }) : "", "Pay"] })))) : (success ? (_jsxs(Alert, Object.assign({ variant: "success" }, { children: [_jsx("p", { children: _jsx("strong", { children: "Swap successful" }) }), "Swap was concluded successfully"] }))) : (_jsxs(_Fragment, { children: [_jsxs(Alert, Object.assign({ variant: "danger", className: "mb-3" }, { children: [_jsx("p", { children: _jsx("strong", { children: "Swap failed" }) }), error] })), refund ? (_jsxs(Button, Object.assign({ onClick: onRefund, className: refunded ? "d-none" : "", disabled: refunding, variant: "secondary" }, { children: [refunding ? _jsx(Spinner, { animation: "border", size: "sm", className: "mr-2" }) : "", "Refund deposit"] }))) : (_jsx(Button, Object.assign({ onClick: props.refreshQuote, variant: "secondary" }, { children: "New quote" })))] })))] }));
}
function LNURLWithdrawQuoteSummary(props) {
    const [quoteTimeRemaining, setQuoteTimeRemaining] = useState();
    const [initialQuoteTimeout, setInitialQuoteTimeout] = useState();
    const expiryTime = useRef();
    const [loading, setLoading] = useState();
    const [success, setSuccess] = useState();
    const [error, setError] = useState();
    useEffect(() => {
        if (props.quote == null)
            return () => { };
        setSuccess(null);
        setError(null);
        let interval;
        interval = setInterval(() => {
            let dt = expiryTime.current - Date.now();
            if (dt <= 0) {
                clearInterval(interval);
                dt = 0;
            }
            setQuoteTimeRemaining(Math.floor(dt / 1000));
        }, 500);
        expiryTime.current = Date.now() + (30 * 1000);
        const dt = Math.floor((expiryTime.current - Date.now()) / 1000);
        setInitialQuoteTimeout(dt);
        setQuoteTimeRemaining(dt);
        return () => {
            clearInterval(interval);
        };
    }, [props.quote]);
    const onContinue = async () => {
        if (!props.quote.prPosted) {
            setLoading(true);
            try {
                if (props.setAmountLock)
                    props.setAmountLock(true);
                await props.quote.waitForPayment();
                await props.quote.commitAndClaim();
                setSuccess(true);
            }
            catch (e) {
                setSuccess(false);
                setError(e.toString());
            }
            if (props.setAmountLock)
                props.setAmountLock(false);
            setLoading(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", Object.assign({ className: success === null && !loading ? "d-flex flex-column mb-3" : "d-none" }, { children: [quoteTimeRemaining === 0 ? (_jsx("label", { children: "Quote expired!" })) : (_jsxs("label", { children: ["Quote expires in ", quoteTimeRemaining, " seconds"] })), _jsx(ProgressBar, { animated: true, now: quoteTimeRemaining, max: initialQuoteTimeout, min: 0 })] })), success === null ? (quoteTimeRemaining === 0 ? (_jsx(Button, Object.assign({ onClick: props.refreshQuote, variant: "secondary" }, { children: "New quote" }))) : (_jsxs(Button, Object.assign({ onClick: onContinue, disabled: loading, size: "lg" }, { children: [loading ? _jsx(Spinner, { animation: "border", size: "sm", className: "mr-2" }) : "", "Claim"] })))) : (success ? (_jsxs(Alert, Object.assign({ variant: "success" }, { children: [_jsx("p", { children: _jsx("strong", { children: "Swap successful" }) }), "Swap was concluded successfully"] }))) : (_jsxs(Alert, Object.assign({ variant: "danger", className: "mb-3" }, { children: [_jsx("p", { children: _jsx("strong", { children: "Swap failed" }) }), error] }))))] }));
}
export function QuoteSummary(props) {
    if (props.quote instanceof IToBTCSwap)
        return _jsx(ToBTCQuoteSummary, { setAmountLock: props.setAmountLock, quote: props.quote, refreshQuote: props.refreshQuote });
    if (props.quote instanceof IFromBTCSwap) {
        if (props.quote instanceof FromBTCLNSwap) {
            if (props.quote.lnurl != null) {
                return _jsx(LNURLWithdrawQuoteSummary, { setAmountLock: props.setAmountLock, quote: props.quote, refreshQuote: props.refreshQuote });
            }
            else {
                return _jsx(FromBTCLNQuoteSummary, { setAmountLock: props.setAmountLock, quote: props.quote, refreshQuote: props.refreshQuote });
            }
        }
        if (props.quote instanceof FromBTCSwap)
            return _jsx(FromBTCQuoteSummary, { setAmountLock: props.setAmountLock, quote: props.quote, refreshQuote: props.refreshQuote });
    }
}

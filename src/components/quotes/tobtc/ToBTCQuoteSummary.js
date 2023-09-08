import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Alert, Button, ProgressBar, Spinner } from "react-bootstrap";
export function ToBTCQuoteSummary(props) {
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
    return (_jsxs(_Fragment, { children: [_jsxs("div", Object.assign({ className: success === null && !loading ? "d-flex flex-column mb-3 tab-accent" : "d-none" }, { children: [quoteTimeRemaining === 0 ? (_jsx("label", { children: "Quote expired!" })) : (_jsxs("label", { children: ["Quote expires in ", quoteTimeRemaining, " seconds"] })), _jsx(ProgressBar, { animated: true, now: quoteTimeRemaining, max: initialQuoteTimeout, min: 0 })] })), success === null ? (quoteTimeRemaining === 0 && !loading ? (_jsx(Button, Object.assign({ onClick: props.refreshQuote, variant: "secondary" }, { children: "New quote" }))) : (_jsxs(Button, Object.assign({ onClick: onContinue, disabled: loading, size: "lg" }, { children: [loading ? _jsx(Spinner, { animation: "border", size: "sm", className: "mr-2" }) : "", props.type === "payment" ? "Pay" : "Swap"] })))) : (success ? (_jsxs(Alert, Object.assign({ variant: "success", className: "mb-0" }, { children: [_jsx("strong", { children: "Swap successful" }), _jsx("label", { children: "Swap was concluded successfully" })] }))) : (_jsxs(_Fragment, { children: [_jsxs(Alert, Object.assign({ variant: "danger", className: "mb-3" }, { children: [_jsx("strong", { children: "Swap failed" }), _jsx("label", { children: error })] })), refund ? (_jsxs(Button, Object.assign({ onClick: onRefund, className: refunded ? "d-none" : "", disabled: refunding, variant: "secondary" }, { children: [refunding ? _jsx(Spinner, { animation: "border", size: "sm", className: "mr-2" }) : "", "Refund deposit"] }))) : (_jsx(Button, Object.assign({ onClick: props.refreshQuote, variant: "secondary" }, { children: "New quote" })))] })))] }));
}

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Alert, Button, ProgressBar, Spinner } from "react-bootstrap";
export function LNURLWithdrawQuoteSummary(props) {
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
    return (_jsxs(_Fragment, { children: [_jsxs("div", Object.assign({ className: success === null && !loading ? "d-flex flex-column mb-3" : "d-none" }, { children: [quoteTimeRemaining === 0 ? (_jsx("label", { children: "Quote expired!" })) : (_jsxs("label", { children: ["Quote expires in ", quoteTimeRemaining, " seconds"] })), _jsx(ProgressBar, { animated: true, now: quoteTimeRemaining, max: initialQuoteTimeout, min: 0 })] })), success === null ? (quoteTimeRemaining === 0 && !loading ? (_jsx(Button, Object.assign({ onClick: props.refreshQuote, variant: "secondary" }, { children: "New quote" }))) : (_jsxs(Button, Object.assign({ onClick: onContinue, disabled: loading, size: "lg" }, { children: [loading ? _jsx(Spinner, { animation: "border", size: "sm", className: "mr-2" }) : "", "Claim"] })))) : (success ? (_jsxs(Alert, Object.assign({ variant: "success" }, { children: [_jsx("p", { children: _jsx("strong", { children: "Swap successful" }) }), "Swap was concluded successfully"] }))) : (_jsxs(_Fragment, { children: [_jsxs(Alert, Object.assign({ variant: "danger", className: "mb-3" }, { children: [_jsx("p", { children: _jsx("strong", { children: "Swap failed" }) }), error] })), _jsx(Button, Object.assign({ onClick: props.refreshQuote, variant: "secondary" }, { children: "New quote" }))] })))] }));
}

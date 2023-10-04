import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Alert, Button, Overlay, ProgressBar, Spinner, Tooltip } from "react-bootstrap";
import { QRCodeSVG } from "qrcode.react";
import ValidatedInput from "../../ValidatedInput";
import { FromBTCLNSwapState } from "sollightning-sdk";
import { clipboard } from 'react-icons-kit/fa/clipboard';
import Icon from "react-icons-kit";
export function FromBTCLNQuoteSummary(props) {
    const [state, setState] = useState(null);
    const [quoteTimeRemaining, setQuoteTimeRemaining] = useState();
    const [initialQuoteTimeout, setInitialQuoteTimeout] = useState();
    const expiryTime = useRef();
    const [isStarted, setStarted] = useState();
    const [loading, setLoading] = useState();
    const [success, setSuccess] = useState();
    const [error, setError] = useState();
    const abortControllerRef = useRef(new AbortController());
    const qrCodeRef = useRef();
    const textFieldRef = useRef();
    const copyBtnRef = useRef();
    const [showCopyOverlay, setShowCopyOverlay] = useState(0);
    useEffect(() => {
        if (showCopyOverlay === 0) {
            return;
        }
        const timeout = setTimeout(() => {
            setShowCopyOverlay(0);
        }, 2000);
        return () => {
            clearTimeout(timeout);
        };
    }, [showCopyOverlay]);
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
                if (props.setAmountLock != null)
                    props.setAmountLock(false);
                abortControllerRef.current.abort();
            }
            setQuoteTimeRemaining(Math.floor(dt / 1000));
        }, 500);
        expiryTime.current = props.quote.getTimeoutTime();
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
        props.quote.waitForPayment(abortControllerRef.current.signal).catch(e => {
            if (abortControllerRef.current.signal.aborted)
                return;
            setError(e.toString());
            if (props.setAmountLock != null)
                props.setAmountLock(false);
        });
    };
    const onClaim = async () => {
        setLoading(true);
        try {
            await props.quote.commitAndClaim();
            setSuccess(true);
        }
        catch (e) {
            setSuccess(false);
            setError(e.toString());
        }
        setLoading(false);
    };
    useEffect(() => {
        if (isStarted) {
            // @ts-ignore
            window.scrollBy(0, 99999);
        }
    }, [isStarted]);
    const copy = (num) => {
        try {
            // @ts-ignore
            navigator.clipboard.writeText(props.quote.getAddress());
        }
        catch (e) {
            console.error(e);
        }
        try {
            // @ts-ignore
            textFieldRef.current.input.current.select();
            // @ts-ignore
            document.execCommand('copy');
            // @ts-ignore
            textFieldRef.current.input.current.blur();
        }
        catch (e) {
            console.error(e);
        }
        setShowCopyOverlay(num);
    };
    return (_jsxs(_Fragment, { children: [error != null ? (_jsxs(Alert, Object.assign({ variant: "danger", className: "mb-3" }, { children: [_jsx("strong", { children: "Swap failed" }), _jsx("label", { children: error })] }))) : "", state === FromBTCLNSwapState.PR_CREATED ? (!isStarted ? (_jsxs(_Fragment, { children: [_jsxs("div", Object.assign({ className: success === null && !loading ? "d-flex flex-column mb-3 tab-accent" : "d-none" }, { children: [quoteTimeRemaining === 0 ? (_jsx("label", { children: "Quote expired!" })) : (_jsxs("label", { children: ["Quote expires in ", quoteTimeRemaining, " seconds"] })), _jsx(ProgressBar, { animated: true, now: quoteTimeRemaining, max: initialQuoteTimeout, min: 0 })] })), quoteTimeRemaining === 0 && !loading ? (_jsx(Button, Object.assign({ onClick: props.refreshQuote, variant: "secondary" }, { children: "New quote" }))) : (_jsxs(Button, Object.assign({ onClick: onCommit, disabled: loading, size: "lg" }, { children: [loading ? _jsx(Spinner, { animation: "border", size: "sm", className: "mr-2" }) : "", "Initiate swap"] })))] })) : (_jsxs(_Fragment, { children: [quoteTimeRemaining === 0 ? "" : (_jsxs("div", Object.assign({ className: "tab-accent mb-3" }, { children: [_jsx(Overlay, Object.assign({ target: showCopyOverlay === 1 ? copyBtnRef.current : (showCopyOverlay === 2 ? qrCodeRef.current : null), show: showCopyOverlay > 0, placement: "top" }, { children: (props) => (_jsx(Tooltip, Object.assign({ id: "overlay-example" }, props, { children: "Address copied to clipboard!" }))) })), _jsx("div", Object.assign({ ref: qrCodeRef }, { children: _jsx(QRCodeSVG, { value: props.quote.getQrData(), size: 300, includeMargin: true, className: "cursor-pointer", onClick: () => {
                                        copy(2);
                                    } }) })), _jsx("label", { children: "Please initiate a payment to this lightning network invoice" }), _jsx(ValidatedInput, { type: "text", value: props.quote.getAddress(), textEnd: (_jsx("a", Object.assign({ href: "javascript:void(0);", ref: copyBtnRef, onClick: () => {
                                        copy(1);
                                    } }, { children: _jsx(Icon, { icon: clipboard }) }))), inputRef: textFieldRef })] }))), _jsxs("div", Object.assign({ className: "d-flex flex-column mb-3 tab-accent" }, { children: [quoteTimeRemaining === 0 ? (_jsx("label", { children: "Quote expired!" })) : (_jsxs("label", { children: ["Quote expires in ", quoteTimeRemaining, " seconds"] })), _jsx(ProgressBar, { animated: true, now: quoteTimeRemaining, max: initialQuoteTimeout, min: 0 })] })), quoteTimeRemaining === 0 ? (_jsx(Button, Object.assign({ onClick: props.refreshQuote, variant: "secondary" }, { children: "New quote" }))) : (_jsx(Button, Object.assign({ onClick: props.abortSwap, variant: "danger" }, { children: "Abort swap" })))] }))) : "", state === FromBTCLNSwapState.PR_PAID || state === FromBTCLNSwapState.CLAIM_COMMITED ? (_jsxs(_Fragment, { children: [quoteTimeRemaining !== 0 ? (_jsxs("div", Object.assign({ className: "mb-3 tab-accent" }, { children: [_jsx("label", { children: "Lightning network payment received" }), _jsx("label", { children: "Claim it below to finish the swap!" })] }))) : "", state === FromBTCLNSwapState.PR_PAID ? (_jsxs("div", Object.assign({ className: success === null && !loading ? "d-flex flex-column mb-3 tab-accent" : "d-none" }, { children: [quoteTimeRemaining === 0 ? (_jsx("label", { children: "Swap expired! Your lightning payment should refund shortly." })) : (_jsxs("label", { children: ["Offer expires in ", quoteTimeRemaining, " seconds"] })), _jsx(ProgressBar, { animated: true, now: quoteTimeRemaining, max: initialQuoteTimeout, min: 0 })] }))) : "", quoteTimeRemaining === 0 && !loading ? (_jsx(Button, Object.assign({ onClick: props.refreshQuote, variant: "secondary" }, { children: "New quote" }))) : (_jsxs(Button, Object.assign({ onClick: onClaim, disabled: loading, size: "lg" }, { children: [loading ? _jsx(Spinner, { animation: "border", size: "sm", className: "mr-2" }) : "", "Finish swap (claim funds)"] })))] })) : "", state === FromBTCLNSwapState.CLAIM_CLAIMED ? (_jsxs(Alert, Object.assign({ variant: "success", className: "mb-0" }, { children: [_jsx("strong", { children: "Swap successful" }), _jsx("label", { children: "Swap was concluded successfully" })] }))) : ""] }));
}

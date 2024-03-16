import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Alert, Button, Overlay, ProgressBar, Spinner, Tooltip } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { Topbar } from "../Topbar";
import { useEffect, useRef, useState } from "react";
import { btcCurrency, nativeCurrency, toHumanReadableString } from "../../utils/Currencies";
import Icon from "react-icons-kit";
import * as BN from "bn.js";
import ValidatedInput from "../ValidatedInput";
import { QRCodeSVG } from "qrcode.react";
import { clipboard } from "react-icons-kit/fa/clipboard";
import { ic_south } from 'react-icons-kit/md/ic_south';
const swapAmount = 7500000;
const swapAmountSol = swapAmount / 1000000000;
export function SwapForGasScreen(props) {
    const navigate = useNavigate();
    const { search, state } = useLocation();
    const [swapData, setSwapData] = useState(null);
    const [quoteTimeRemaining, setQuoteTimeRemaining] = useState(0);
    const [initialQuoteTimeout, setInitialQuoteTimeout] = useState(0);
    const expiryTime = useRef();
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const abortControllerRef = useRef(null);
    const intervalRef = useRef(null);
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
    const createSwap = () => {
        setLoading(true);
        setError(null);
        setSuccess(false);
        props.swapper.createTrustedLNForGasSwap(new BN(swapAmount)).then(swap => {
            if (abortControllerRef.current.signal.aborted)
                return;
            setLoading(false);
            setSwapData(swap);
            if (intervalRef.current != null)
                clearInterval(intervalRef.current);
            let interval;
            interval = setInterval(() => {
                let dt = expiryTime.current - Date.now();
                if (dt <= 0) {
                    clearInterval(interval);
                    if (interval === intervalRef.current)
                        intervalRef.current = null;
                    dt = 0;
                }
                setQuoteTimeRemaining(Math.floor(dt / 1000));
            }, 500);
            intervalRef.current = interval;
            expiryTime.current = swap.getTimeoutTime();
            const dt = Math.floor((expiryTime.current - Date.now()) / 1000);
            setInitialQuoteTimeout(dt);
            setQuoteTimeRemaining(dt);
            return swap.waitForPayment(abortControllerRef.current.signal, 2);
        }).then((result) => {
            if (result == null)
                return;
            if (result instanceof Object) {
                setSuccess(true);
            }
        }).catch(err => {
            console.error(err);
            setError(err.toString());
            if (intervalRef.current != null)
                clearInterval(intervalRef.current);
            setQuoteTimeRemaining(0);
            setInitialQuoteTimeout(0);
            setSwapData(null);
            setLoading(false);
        });
    };
    useEffect(() => {
        abortControllerRef.current = new AbortController();
        if (props.swapper == null)
            return () => { };
        createSwap();
        return () => {
            abortControllerRef.current.abort();
            if (intervalRef.current != null)
                clearInterval(intervalRef.current);
            intervalRef.current = null;
        };
    }, [props.swapper]);
    const copy = (num) => {
        try {
            // @ts-ignore
            navigator.clipboard.writeText(swapData.getAddress());
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
    return (_jsxs(_Fragment, { children: [_jsx(Topbar, { selected: 3, enabled: true }), _jsx("div", { className: "d-flex flex-column flex-fill justify-content-center align-items-center text-white", children: _jsx("div", { className: "quickscan-summary-panel d-flex flex-column flex-fill", children: _jsxs("div", { className: "p-3 d-flex flex-column tab-bg border-0 card mb-3", children: [error ? (_jsxs(Alert, { variant: "danger", className: "mb-3", children: [_jsx("p", { children: _jsx("strong", { children: "Loading error" }) }), error] })) : "", success ? (_jsxs(Alert, { variant: "success", className: "mb-3", children: [_jsx("p", { children: _jsx("strong", { children: "Swap successful" }) }), "Successfully swapped ", toHumanReadableString(swapData.getInAmount(), btcCurrency), " BTC to ", swapAmountSol, " SOL"] })) : "", _jsx(Alert, { className: "text-center mb-3 d-flex align-items-center flex-column", show: swapData != null && !success && !error, variant: "success", closeVariant: "white", children: _jsxs("label", { children: ["Swap for gas is a trusted service allowing you to swap BTC-LN to SOL, so you can then cover the gas fees of a trustless atomiq swap. Note that this is a trusted service and is therefore only used for very small amounts! You can read more about it in our ", _jsx("a", { href: "/faq?tabOpen=11", children: "FAQ" }), "."] }) }), loading ? (_jsxs("div", { className: "d-flex flex-column align-items-center justify-content-center tab-accent", children: [_jsx(Spinner, { animation: "border" }), "Creating gas swap..."] })) : "", swapData != null ? (_jsxs("div", { className: "mb-3 tab-accent-p3 text-center", children: [_jsx(ValidatedInput, { type: "number", textEnd: (_jsxs("span", { className: "text-white font-bigger d-flex align-items-center", children: [_jsx("img", { src: btcCurrency.icon, className: "currency-icon" }), "BTC"] })), disabled: true, size: "lg", value: toHumanReadableString(swapData.getInAmount(), btcCurrency), onChange: () => { }, placeholder: "Input amount" }), _jsx(Icon, { size: 24, icon: ic_south, className: "my-1" }), _jsx(ValidatedInput, { type: "number", textEnd: (_jsxs("span", { className: "text-white font-bigger d-flex align-items-center", children: [_jsx("img", { src: nativeCurrency.icon, className: "currency-icon" }), nativeCurrency.ticker] })), disabled: true, size: "lg", value: toHumanReadableString(swapData.getOutAmount(), nativeCurrency), onChange: () => { }, placeholder: "Output amount" })] })) : "", quoteTimeRemaining === 0 || success ? "" : (_jsxs("div", { className: "mb-3 tab-accent", children: [_jsx(Overlay, { target: showCopyOverlay === 1 ? copyBtnRef.current : (showCopyOverlay === 2 ? qrCodeRef.current : null), show: showCopyOverlay > 0, placement: "top", children: (props) => (_jsx(Tooltip, { id: "overlay-example", ...props, children: "Address copied to clipboard!" })) }), _jsx("div", { ref: qrCodeRef, children: _jsx(QRCodeSVG, { value: swapData.getQrData(), size: 300, includeMargin: true, className: "cursor-pointer", onClick: () => {
                                                copy(2);
                                            } }) }), _jsx("label", { children: "Please pay this lightning network invoice" }), _jsx(ValidatedInput, { type: "text", value: swapData.getAddress(), textEnd: (_jsx("a", { href: "javascript:void(0);", ref: copyBtnRef, onClick: () => {
                                                copy(1);
                                            }, children: _jsx(Icon, { icon: clipboard }) })), inputRef: textFieldRef })] })), _jsxs("div", { className: !success && !loading ? "d-flex flex-column tab-accent" : "d-none", children: [quoteTimeRemaining === 0 ? (_jsx("label", { children: "Gas swap expired!" })) : (_jsxs("label", { children: ["Gas swap expires in ", quoteTimeRemaining, " seconds"] })), _jsx(ProgressBar, { animated: true, now: quoteTimeRemaining, max: initialQuoteTimeout, min: 0 })] }), quoteTimeRemaining === 0 && !loading && !success ? (_jsx(Button, { onClick: createSwap, variant: "secondary", className: "mt-3", children: "New gas swap" })) : "", success && state?.returnPath != null ? (_jsx(Button, { onClick: () => {
                                    navigate(state.returnPath);
                                }, variant: "primary", className: "mt-3", children: "Continue" })) : ""] }) }) })] }));
}

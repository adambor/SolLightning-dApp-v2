import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FromBTCLNSwap, FromBTCSwap, IToBTCSwap } from "sollightning-sdk";
import { getCurrencySpec, getNativeCurrency, toHumanReadableString } from "../utils/Currencies";
export function SimpleFeeSummaryScreen(props) {
    if (props.swap instanceof IToBTCSwap) {
        const currency = getCurrencySpec(props.swap.getToken());
        return (_jsxs("div", Object.assign({ className: props.className }, { children: [_jsxs("div", Object.assign({ className: "d-flex fw-bold border-bottom border-light font-medium" }, { children: [_jsx("span", { children: "Total fee:" }), _jsxs("span", Object.assign({ className: "ms-auto" }, { children: [_jsx("img", { src: currency.icon, className: "currency-icon-small" }), toHumanReadableString(props.swap.getFee(), currency), " ", currency.ticker] }))] })), _jsxs("div", Object.assign({ className: "d-flex my-2" }, { children: [_jsx("span", { children: "Swap fee:" }), _jsxs("span", Object.assign({ className: "ms-auto" }, { children: [toHumanReadableString(props.swap.getSwapFee(), currency), " ", currency.ticker] }))] })), _jsxs("div", Object.assign({ className: "d-flex my-2" }, { children: [_jsx("span", { children: "Network fee:" }), _jsxs("span", Object.assign({ className: "ms-auto" }, { children: [toHumanReadableString(props.swap.getNetworkFee(), currency), " ", currency.ticker] }))] }))] })));
    }
    if (props.swap instanceof FromBTCSwap) {
        const currency = getCurrencySpec(props.swap.getToken());
        return (_jsxs("div", Object.assign({ className: props.className }, { children: [_jsxs("div", Object.assign({ className: "d-flex fw-bold font-medium" }, { children: [_jsx("span", { children: "Swap fee:" }), _jsxs("span", Object.assign({ className: "ms-auto" }, { children: [_jsx("img", { src: currency.icon, className: "currency-icon-small" }), toHumanReadableString(props.swap.getFee(), currency), " ", currency.ticker] }))] })), _jsxs("div", Object.assign({ className: "d-flex fw-bold font-medium" }, { children: [_jsx("span", { children: "Watchtower fee:" }), _jsxs("span", Object.assign({ className: "ms-auto" }, { children: [_jsx("img", { src: getNativeCurrency().icon, className: "currency-icon-small" }), toHumanReadableString(props.swap.getClaimerBounty(), getNativeCurrency()), " ", getNativeCurrency().ticker] }))] }))] })));
    }
    if (props.swap instanceof FromBTCLNSwap) {
        const currency = getCurrencySpec(props.swap.getToken());
        return (_jsx("div", Object.assign({ className: props.className }, { children: _jsxs("div", Object.assign({ className: "d-flex fw-bold font-medium" }, { children: [_jsx("span", { children: "Swap fee:" }), _jsxs("span", Object.assign({ className: "ms-auto" }, { children: [_jsx("img", { src: currency.icon, className: "currency-icon-small" }), toHumanReadableString(props.swap.getFee(), currency), " ", currency.ticker] }))] })) })));
    }
    return null;
}

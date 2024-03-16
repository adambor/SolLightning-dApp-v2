import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FromBTCLNSwap, FromBTCSwap, IToBTCSwap, ToBTCSwap } from "sollightning-sdk";
import { bitcoinCurrencies, getCurrencySpec, getNativeCurrency, toHumanReadableString } from "../utils/Currencies";
export function FeePart(props) {
    return (_jsxs("div", { className: "d-flex font-medium " + props.className, children: [_jsx("span", { className: "d-flex align-items-center" + (props.bold ? " fw-bold" : ""), children: props.text }), _jsxs("span", { className: "ms-auto text-end", children: [_jsxs("span", { className: "fw-bold d-flex mb--6 align-items-center justify-content-end", children: [_jsx("img", { src: props.currency1.icon, className: "currency-icon-small", style: { marginTop: "-1px" } }), _jsx("span", { children: toHumanReadableString(props.amount1, props.currency1) })] }), _jsxs("span", { className: "d-flex align-items-center justify-content-end", children: [_jsx("img", { src: props.currency2.icon, className: "currency-icon-small" }), _jsx("small", { style: { marginTop: "2px" }, children: toHumanReadableString(props.amount2, props.currency2) })] })] })] }));
}
export function SimpleFeeSummaryScreen(props) {
    let className;
    if (props.className == null) {
        className = "tab-accent";
    }
    else {
        className = props.className + " tab-accent";
    }
    if (props.swap instanceof IToBTCSwap) {
        const currency = getCurrencySpec(props.swap.getToken());
        const btcCurrency = bitcoinCurrencies[props.swap instanceof ToBTCSwap ? 0 : 1];
        const swapFee = props.swap.getSwapFee();
        const swapBtcFee = swapFee.mul(props.swap.getOutAmount()).div(props.swap.getInAmountWithoutFee());
        const networkFee = props.swap.getNetworkFee();
        const networkBtcFee = networkFee.mul(props.swap.getOutAmount()).div(props.swap.getInAmountWithoutFee());
        const fee = props.swap.getFee();
        const btcFee = swapBtcFee.add(networkBtcFee);
        return (_jsxs("div", { className: className, children: [_jsx(FeePart, { className: "border-bottom border-light", bold: true, text: "Total fee:", currency1: currency, amount1: fee, currency2: btcCurrency, amount2: btcFee }), _jsx(FeePart, { text: "Swap fee:", currency1: currency, amount1: swapFee, currency2: btcCurrency, amount2: swapBtcFee }), _jsx(FeePart, { text: "Network fee:", currency1: currency, amount1: networkFee, currency2: btcCurrency, amount2: networkBtcFee })] }));
    }
    if (props.swap instanceof FromBTCSwap) {
        const currency = getCurrencySpec(props.swap.getToken());
        const fee = props.swap.getFee();
        const btcFee = fee.mul(props.swap.getInAmount()).div(props.swap.getOutAmountWithoutFee());
        return (_jsxs("div", { className: className, children: [_jsx(FeePart, { className: "border-bottom border-light pb-2", text: "Swap fee:", currency1: bitcoinCurrencies[0], amount1: btcFee, currency2: currency, amount2: fee }), _jsxs("div", { className: "d-flex font-medium py-2 mt-2", children: [_jsx("span", { children: "Watchtower fee:" }), _jsxs("span", { className: "ms-auto fw-bold d-flex align-items-center", children: [_jsx("img", { src: getNativeCurrency().icon, className: "currency-icon-small", style: { marginTop: "-2px" } }), toHumanReadableString(props.swap.getClaimerBounty(), getNativeCurrency())] })] })] }));
    }
    if (props.swap instanceof FromBTCLNSwap) {
        const fee = props.swap.getFee();
        const btcFee = fee.mul(props.swap.getInAmount()).div(props.swap.getOutAmountWithoutFee());
        const currency = getCurrencySpec(props.swap.getToken());
        return (_jsx("div", { className: className, children: _jsx(FeePart, { text: "Swap fee:", currency1: bitcoinCurrencies[1], amount1: btcFee, currency2: currency, amount2: fee }) }));
    }
    return null;
}

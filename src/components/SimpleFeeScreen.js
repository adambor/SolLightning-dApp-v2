import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { FromBTCLNSwap, FromBTCSwap, IToBTCSwap, ToBTCSwap } from "sollightning-sdk";
import { bitcoinCurrencies, getCurrencySpec, getNativeCurrency, toHumanReadableString } from "../utils/Currencies";
import { Badge, OverlayTrigger, Tooltip } from "react-bootstrap";
import { getFeePct } from "../utils/Utils";
function FeePart(props) {
    return (_jsxs("div", Object.assign({ className: "d-flex font-medium " + props.className }, { children: [_jsxs("span", Object.assign({ className: "d-flex align-items-center" + (props.bold ? " fw-bold" : "") }, { children: [props.text, props.feePPM == null ? "" : props.feeBase == null ? (_jsxs(Badge, Object.assign({ bg: "primary", className: "ms-1 pill-round px-2", pill: true }, { children: [props.feePPM.toNumber() / 10000, " %"] }))) : (_jsx(OverlayTrigger, Object.assign({ overlay: _jsx(Tooltip, Object.assign({ id: "fee-tooltip-" + props.text }, { children: _jsxs("span", { children: [props.feePPM.toNumber() / 10000, "% + ", toHumanReadableString(props.feeBase, props.feeCurrency), " ", props.feeCurrency.ticker] }) })) }, { children: _jsx(Badge, Object.assign({ bg: "primary", className: "ms-1 pill-round px-2", pill: true }, { children: _jsxs("span", Object.assign({ className: "dottedUnderline" }, { children: [props.feePPM.toNumber() / 10000, "%"] })) })) }))), props.description != null ? (_jsx(OverlayTrigger, Object.assign({ overlay: _jsx(Tooltip, Object.assign({ id: "fee-tooltip-desc-" + props.text }, { children: _jsx("span", { children: props.description }) })) }, { children: _jsx(Badge, Object.assign({ bg: "primary", className: "ms-1 pill-round px-2", pill: true }, { children: _jsx("span", Object.assign({ className: "dottedUnderline" }, { children: "?" })) })) }))) : ""] })), props.currency2 == null ? (_jsxs("span", Object.assign({ className: "ms-auto fw-bold d-flex align-items-center" }, { children: [_jsx("img", { src: props.currency1.icon, className: "currency-icon-small", style: { marginTop: "-2px" } }), _jsx("span", { children: toHumanReadableString(props.amount1, props.currency1) })] }))) : (_jsxs("span", Object.assign({ className: "ms-auto text-end" }, { children: [_jsxs("span", Object.assign({ className: "fw-bold d-flex mb--6 align-items-center justify-content-end" }, { children: [_jsx("img", { src: props.currency1.icon, className: "currency-icon-small", style: { marginTop: "-1px" } }), _jsx("span", { children: toHumanReadableString(props.amount1, props.currency1) })] })), _jsxs("span", Object.assign({ className: "d-flex align-items-center justify-content-end" }, { children: [_jsx("img", { src: props.currency2.icon, className: "currency-icon-small" }), _jsx("small", Object.assign({ style: { marginTop: "2px" } }, { children: toHumanReadableString(props.amount2, props.currency2) }))] }))] })))] })));
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
        return (_jsxs("div", Object.assign({ className: className }, { children: [_jsx(FeePart, { className: "border-bottom border-light", bold: true, text: "Total fee", currency1: currency, amount1: fee, currency2: btcCurrency, amount2: btcFee }), _jsx(FeePart, { text: "Swap fee", feePPM: getFeePct(props.swap, 1), feeBase: props.swap.pricingInfo.satsBaseFee, feeCurrency: btcCurrency, currency1: currency, amount1: swapFee, currency2: btcCurrency, amount2: swapBtcFee }), _jsx(FeePart, { text: "Network fee", currency1: currency, amount1: networkFee, currency2: btcCurrency, amount2: networkBtcFee, description: props.swap instanceof ToBTCSwap ?
                        "Bitcoin transaction fee paid to bitcoin miners" :
                        "Lightning network fee paid for routing the payment through the network" })] })));
    }
    if (props.swap instanceof FromBTCSwap) {
        const currency = getCurrencySpec(props.swap.getToken());
        const btcCurrency = bitcoinCurrencies[0];
        const fee = props.swap.getFee();
        const btcFee = fee.mul(props.swap.getInAmount()).div(props.swap.getOutAmountWithoutFee());
        return (_jsxs("div", Object.assign({ className: className }, { children: [_jsx(FeePart, { className: "border-bottom border-light pb-2", text: "Swap fee", feePPM: getFeePct(props.swap, 1), feeBase: props.swap.pricingInfo.satsBaseFee, feeCurrency: btcCurrency, currency1: btcCurrency, amount1: btcFee, currency2: currency, amount2: fee }), _jsx(FeePart, { className: "py-2 mt-2", text: "Watchtower fee", currency1: getNativeCurrency(), amount1: props.swap.getClaimerBounty(), description: "Fee paid to swap watchtowers which automatically claim the swap for you as soon as the bitcoin transaction confirms." })] })));
    }
    if (props.swap instanceof FromBTCLNSwap) {
        const fee = props.swap.getFee();
        const btcFee = fee.mul(props.swap.getInAmount()).div(props.swap.getOutAmountWithoutFee());
        const btcCurrency = bitcoinCurrencies[1];
        const currency = getCurrencySpec(props.swap.getToken());
        return (_jsx("div", Object.assign({ className: className }, { children: _jsx(FeePart, { text: "Swap fee", feePPM: getFeePct(props.swap, 1), feeBase: props.swap.pricingInfo.satsBaseFee, feeCurrency: btcCurrency, currency1: btcCurrency, amount1: btcFee, currency2: currency, amount2: fee }) })));
    }
    return null;
}

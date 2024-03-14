import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Alert, Badge, Card, Col, Form, Placeholder, Row, } from "react-bootstrap";
import { bitcoinCurrencies, getCurrencySpec, toHumanReadableString } from "../../utils/Currencies";
import { useEffect, useState } from "react";
import ValidatedInput from "../ValidatedInput";
import { FEConstants } from "../../FEConstants";
import * as BN from "bn.js";
import { SingleColumnStaticTable } from "../table/SingleColumnTable";
import { getTimeDeltaText } from "../../utils/Utils";
export function AffiliateScreen(props) {
    var _a, _b, _c, _d, _e, _f, _g;
    const [data, setData] = useState();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState();
    useEffect(() => {
        if (props.swapper == null)
            return;
        const address = props.swapper.swapContract.getAddress();
        if (address != null) {
            setLoading(true);
            setError(null);
            setData(null);
            fetch(FEConstants.affiliateUrl + "?affiliate=" + encodeURIComponent(address)).then(resp => {
                return resp.json();
            }).then(obj => {
                setLoading(false);
                if (obj.code !== 10000) {
                    setError(obj.msg);
                    return;
                }
                obj.data.stats.payouts.sort((a, b) => b.timestamp - a.timestamp);
                setData(obj.data);
            }).catch(e => {
                setLoading(false);
                setError(e.message);
            });
        }
    }, [props.swapper]);
    const currencySpec = (data === null || data === void 0 ? void 0 : data.token) == null ? null : getCurrencySpec(data.token);
    return (_jsx(_Fragment, { children: _jsxs("div", Object.assign({ className: "flex-fill text-white container mt-5 text-start" }, { children: [_jsx("h1", Object.assign({ className: "section-title" }, { children: "Referral" })), _jsxs(Card, Object.assign({ className: "px-3 pt-3 bg-dark bg-opacity-25 mb-3 border-0" }, { children: [_jsx("h3", { children: "How does it work?" }), _jsxs("p", { children: ["Invite your friends to use atomiq via your invite link, they can enjoy reduced ", _jsx("strong", { children: "0.2%" }), " fee rate (instead of regular 0.3%), and you get a kickback for ", _jsx("strong", { children: "0.1%" }), " of their swap volume."] }), _jsxs("p", { children: ["Your kickback is accrued in BTC and payed out automatically to your Solana wallet address in ", (data === null || data === void 0 ? void 0 : data.token) == null ? null : (_a = getCurrencySpec(data === null || data === void 0 ? void 0 : data.token)) === null || _a === void 0 ? void 0 : _a.ticker, " every day (minimum amount for payout is ", _jsxs("strong", { children: [toHumanReadableString(new BN(data === null || data === void 0 ? void 0 : data.minPayoutSats), bitcoinCurrencies[0]), " BTC"] }), ")."] }), _jsxs("p", { children: ["Next payout: ", _jsx("strong", { children: new Date(data === null || data === void 0 ? void 0 : data.nextPayoutTimestamp).toLocaleString() }), " (in ", getTimeDeltaText((data === null || data === void 0 ? void 0 : data.nextPayoutTimestamp) || 0, true), ")"] })] })), _jsxs(Card, Object.assign({ className: "px-3 pt-3 bg-dark bg-opacity-25 mb-3 pb-3 border-0" }, { children: [_jsx("h3", { children: "Your referral link" }), loading ? (_jsx(Placeholder, { xs: 12, as: Form.Control })) : (_jsx(ValidatedInput, { type: "text", value: ((_b = data === null || data === void 0 ? void 0 : data.stats) === null || _b === void 0 ? void 0 : _b.address) == null ? "" : FEConstants.dappUrl + "?affiliate=" + encodeURIComponent(data.stats.identifier), copyEnabled: true }))] })), _jsxs(Row, { children: [_jsx(Col, Object.assign({ xs: 12, lg: 4, className: "pb-3" }, { children: _jsxs(Card, Object.assign({ className: "px-3 pt-3 bg-dark bg-opacity-25 height-100 border-0" }, { children: [_jsx("span", Object.assign({ className: "" }, { children: "Referral swap volume" })), _jsx("h4", Object.assign({ className: "mb-0" }, { children: loading ? (_jsx(Placeholder, { xs: 6 })) : (_jsxs(_Fragment, { children: [_jsx("img", { src: bitcoinCurrencies[0].icon, className: "currency-icon-medium pb-2" }), toHumanReadableString(new BN((_c = data === null || data === void 0 ? void 0 : data.stats) === null || _c === void 0 ? void 0 : _c.totalVolumeSats), bitcoinCurrencies[0]) + " BTC"] })) })), _jsx("small", Object.assign({ className: "mb-2", style: { marginTop: "-6px" } }, { children: loading || currencySpec == null ? (_jsx(Placeholder, { xs: 6 })) : "across " + ((_d = data === null || data === void 0 ? void 0 : data.stats) === null || _d === void 0 ? void 0 : _d.totalSwapCount) + " swaps" }))] })) })), _jsx(Col, Object.assign({ xs: 12, lg: 4, className: "pb-3" }, { children: _jsxs(Card, Object.assign({ className: "px-3 pt-3 bg-dark bg-opacity-25 height-100 border-0" }, { children: [_jsx("span", Object.assign({ className: "" }, { children: "Total accrued kickback" })), _jsx("h4", { children: loading ? (_jsx(Placeholder, { xs: 6 })) : (_jsxs(_Fragment, { children: [_jsx("img", { src: bitcoinCurrencies[0].icon, className: "currency-icon-medium pb-2" }), toHumanReadableString(new BN((_e = data === null || data === void 0 ? void 0 : data.stats) === null || _e === void 0 ? void 0 : _e.totalFeeSats), bitcoinCurrencies[0]) + " BTC"] })) })] })) })), _jsx(Col, Object.assign({ xs: 12, lg: 4, className: "pb-3" }, { children: _jsxs(Card, Object.assign({ className: "px-3 pt-3 bg-dark bg-opacity-25 height-100 border-0" }, { children: [_jsx("span", Object.assign({ className: "" }, { children: "Pending payout" })), _jsx("h4", Object.assign({ className: "mb-0" }, { children: loading ? (_jsx(Placeholder, { xs: 6 })) : (_jsxs(_Fragment, { children: [_jsx("img", { src: bitcoinCurrencies[0].icon, className: "currency-icon-medium pb-2" }), toHumanReadableString(new BN((_f = data === null || data === void 0 ? void 0 : data.stats) === null || _f === void 0 ? void 0 : _f.unclaimedFeeSats), bitcoinCurrencies[0]) + " BTC"] })) })), _jsx("label", Object.assign({ className: "mb-2" }, { children: loading || currencySpec == null ? (_jsx(Placeholder, { xs: 6 })) : (_jsxs(_Fragment, { children: [_jsx("img", { src: currencySpec.icon, className: "currency-icon-small pb-2" }), "~" + toHumanReadableString(new BN(data === null || data === void 0 ? void 0 : data.unclaimedUsdcValue), currencySpec) + " " + currencySpec.ticker] })) }))] })) }))] }), _jsx("h1", Object.assign({ className: "section-title mt-4" }, { children: "Payouts" })), _jsx(SingleColumnStaticTable, { data: ((_g = data === null || data === void 0 ? void 0 : data.stats) === null || _g === void 0 ? void 0 : _g.payouts) != null ? data.stats.payouts : [], column: {
                        renderer: (row) => {
                            let inputAmount = new BN(row.amountSats);
                            let inputCurrency = bitcoinCurrencies[0];
                            let outputAmount = new BN(row.amountToken);
                            let outputCurrency = getCurrencySpec(row.token);
                            let txIdInput = row.txId;
                            return (_jsxs(Row, Object.assign({ className: "d-flex flex-row gx-1 gy-1" }, { children: [_jsx(Col, Object.assign({ xl: 2, md: 12, className: "d-flex text-md-end text-start" }, { children: _jsxs(Row, Object.assign({ className: "gx-1 gy-0 width-fill" }, { children: [_jsx(Col, Object.assign({ xl: 12, md: 4, xs: 12 }, { children: row.state === "pending" ? (_jsx(Badge, Object.assign({ bg: "primary", className: "width-fill" }, { children: "Pending" }))) : row.state === "success" ? (_jsx(Badge, Object.assign({ bg: "success", className: "width-fill" }, { children: "Success" }))) : (_jsx(Badge, Object.assign({ bg: "danger", className: "width-fill" }, { children: "Refunded" }))) })), _jsx(Col, Object.assign({ xl: 12, md: 4, xs: 6 }, { children: _jsx("small", Object.assign({ className: "" }, { children: new Date(row.timestamp).toLocaleString() })) })), _jsx(Col, Object.assign({ xl: 12, md: 4, xs: 6, className: "text-end" }, { children: _jsxs("small", Object.assign({ className: "" }, { children: [getTimeDeltaText(row.timestamp), " ago"] })) }))] })) })), _jsx(Col, Object.assign({ xl: 10, md: 12, className: "d-flex" }, { children: _jsx("div", Object.assign({ className: "card border-0 bg-white bg-opacity-10 p-2 width-fill container-fluid" }, { children: _jsxs("div", Object.assign({ className: "min-width-0" }, { children: [_jsx("a", Object.assign({ className: "font-small single-line-ellipsis", target: "_blank", href: txIdInput == null ? null : FEConstants.solBlockExplorer + txIdInput }, { children: txIdInput || "None" })), _jsxs("span", Object.assign({ className: "d-flex align-items-center font-weight-500 my-1" }, { children: [_jsx("img", { src: outputCurrency.icon, className: "currency-icon-medium" }), toHumanReadableString(outputAmount, outputCurrency), " ", outputCurrency.ticker] })), _jsxs("small", Object.assign({ className: "d-flex align-items-center" }, { children: [_jsx("img", { src: inputCurrency.icon, className: "currency-icon-small" }), toHumanReadableString(inputAmount, inputCurrency), " ", inputCurrency.ticker] }))] })) })) }))] })));
                        }
                    }, itemsPerPage: 10, loading: loading }), error == null ? "" : (_jsxs(Alert, Object.assign({ variant: "danger", className: "mb-2" }, { children: [_jsx("div", { children: _jsx("b", { children: "Loading failed" }) }), error] })))] })) }));
}

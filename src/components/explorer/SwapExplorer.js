import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge, Button, Card, Col, OverlayTrigger, Placeholder, Row, Tooltip } from "react-bootstrap";
import { FEConstants } from "../../FEConstants";
import { useEffect, useMemo, useRef, useState } from "react";
import { SingleColumnBackendTable } from "../table/SingleColumnTable";
import { bitcoinCurrencies, getCurrencySpec, toHumanReadableString } from "../../utils/Currencies";
import * as BN from "bn.js";
import Icon from "react-icons-kit";
import { ic_arrow_forward } from 'react-icons-kit/md/ic_arrow_forward';
import { ic_arrow_downward } from 'react-icons-kit/md/ic_arrow_downward';
import ValidatedInput from "../ValidatedInput";
import { getTimeDeltaText } from "../../utils/Utils";
export function SwapExplorer(props) {
    const refreshTable = useRef(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [search, setSearch] = useState();
    const searchRef = useRef();
    useEffect(() => {
        const abortController = new AbortController();
        setStatsLoading(true);
        fetch(FEConstants.statsUrl + "/GetStats", { signal: abortController.signal }).then(resp => {
            return resp.json();
        }).then(obj => {
            setStats(obj);
            setStatsLoading(false);
        }).catch(e => {
            console.error(e);
            setStatsLoading(false);
        });
        return () => abortController.abort();
    }, []);
    const additionalData = useMemo(() => {
        const additionalData = {};
        if (search != null)
            additionalData.search = search;
        console.log(additionalData);
        return additionalData;
    }, [search]);
    return (_jsxs("div", { className: "flex-fill text-white container mt-5 text-start", children: [_jsx("h1", { className: "section-title", children: "Statistics" }), _jsxs(Row, { children: [_jsx(Col, { xs: 12, md: 6, className: "pb-3", children: _jsxs(Card, { className: "px-3 pt-3 bg-dark bg-opacity-25 height-100 border-0", children: [_jsx("span", { className: "", children: "Total swaps" }), _jsx("h3", { children: statsLoading ? (_jsx(Placeholder, { xs: 6 })) : stats?.totalSwapCount })] }) }), _jsx(Col, { xs: 12, md: 6, className: "pb-3", children: _jsxs(Card, { className: "px-3 pt-3 bg-dark bg-opacity-25 height-100 border-0", children: [_jsx("span", { children: "Total volume" }), _jsx("h3", { children: statsLoading ? (_jsx(Placeholder, { xs: 6 })) : (stats?.totalUsdVolume == null ? null : FEConstants.USDollar.format(stats.totalUsdVolume)) })] }) })] }), _jsx("h1", { className: "section-title mt-4", children: "Explorer" }), _jsxs("div", { className: "d-flex flex-row mb-3", children: [_jsx(ValidatedInput, { className: "width-300px", type: "text", placeholder: "Search by tx ID or wallet address", inputRef: searchRef }), _jsx(Button, { className: "ms-2", onClick: () => {
                            const val = searchRef.current.getValue();
                            if (val === "") {
                                setSearch(null);
                            }
                            else {
                                setSearch(val);
                            }
                        }, children: "Search" })] }), _jsx("div", { children: _jsx(SingleColumnBackendTable, { column: {
                        renderer: (row) => {
                            let inputAmount;
                            let inputCurrency;
                            let outputAmount;
                            let outputCurrency;
                            let inputExplorer;
                            let txIdInput;
                            let outputExplorer;
                            let txIdOutput;
                            let inputAddress = "Unknown";
                            let outputAddress = "Unknown";
                            let inputInfo;
                            let outputInfo;
                            if (row.direction === "ToBTC") {
                                inputAmount = new BN(row.rawAmount);
                                inputCurrency = getCurrencySpec(row.token);
                                outputAmount = row.btcRawAmount == null ? null : new BN(row.btcRawAmount);
                                outputCurrency = row.type === "CHAIN" ? bitcoinCurrencies[0] : bitcoinCurrencies[1];
                                txIdInput = row.txInit;
                                txIdOutput = row.type === "CHAIN" ? row.btcTx : row.paymentHash;
                                inputExplorer = FEConstants.solBlockExplorer;
                                outputExplorer = row.type === "CHAIN" ? FEConstants.btcBlockExplorer : null;
                                if (row.type === "LN") {
                                    outputInfo = "Lightning network amounts and addresses are private!";
                                }
                                else if (!row.finished) {
                                    outputInfo = "BTC amounts for pending swaps are blinded!";
                                }
                                else if (!row.success) {
                                    outputInfo = "BTC amounts & addresses for failed swaps are never un-blinded!";
                                }
                                inputAddress = row.clientWallet;
                                if (row.type === "CHAIN")
                                    outputAddress = row.btcAddress || "Unknown";
                            }
                            else {
                                outputAmount = new BN(row.rawAmount);
                                outputCurrency = getCurrencySpec(row.token);
                                inputAmount = row.btcRawAmount == null ? null : new BN(row.btcRawAmount);
                                inputCurrency = row.type === "CHAIN" ? bitcoinCurrencies[0] : bitcoinCurrencies[1];
                                txIdOutput = row.txInit;
                                txIdInput = row.type === "CHAIN" ? row.btcTx : row.paymentHash;
                                outputExplorer = FEConstants.solBlockExplorer;
                                inputExplorer = row.type === "CHAIN" ? FEConstants.btcBlockExplorer : null;
                                if (row.type === "LN") {
                                    inputInfo = "Lightning network amounts and addresses are private!";
                                }
                                else if (!row.finished) {
                                    inputInfo = "BTC amounts for pending swaps are blinded!";
                                }
                                else if (!row.success) {
                                    inputInfo = "BTC amounts & addresses for failed swaps are never un-blinded!";
                                }
                                outputAddress = row.clientWallet;
                                if (row.type === "CHAIN" && row.btcInAddresses != null) {
                                    inputAddress = row.btcInAddresses[0];
                                }
                            }
                            return (_jsxs(Row, { className: "d-flex flex-row gx-1 gy-1", children: [_jsx(Col, { xl: 2, md: 12, className: "d-flex text-md-end text-start", children: _jsxs(Row, { className: "gx-1 gy-0 width-fill", children: [_jsx(Col, { xl: 6, md: 2, xs: 6, children: !row.finished ? (_jsx(Badge, { bg: "primary", className: "width-fill", children: "Pending" })) : row.success ? (_jsx(Badge, { bg: "success", className: "width-fill", children: "Success" })) : row.direction === "FromBTC" ? (_jsx(Badge, { bg: "warning", className: "width-fill bg-atomiq-orange", children: "Expired" })) : (_jsx(Badge, { bg: "danger", className: "width-fill", children: "Refunded" })) }), _jsx(Col, { xl: 6, md: 2, xs: 6, children: row.type === "CHAIN" ? (_jsx(Badge, { bg: "warning", className: "width-fill", children: "On-chain" })) : (_jsx(Badge, { bg: "dark", className: "width-fill", children: "Lightning" })) }), _jsx(Col, { xl: 0, lg: 2, md: 1, xs: 0 }), _jsx(Col, { xl: 12, lg: 2, md: 3, xs: 6, children: _jsx("small", { className: "", children: new Date(row.timestampInit * 1000).toLocaleString() }) }), _jsx(Col, { xl: 12, md: 2, xs: 3, children: _jsxs("small", { className: "", children: [getTimeDeltaText(row.timestampInit * 1000), " ago"] }) }), _jsx(Col, { xl: 12, md: 2, xs: 3, className: "text-end", children: _jsx("span", { className: "font-weight-500", children: FEConstants.USDollar.format(row._usdValue) }) })] }) }), _jsx(Col, { xl: 10, md: 12, className: "d-flex", children: _jsx("div", { className: "card border-0 bg-white bg-opacity-10 p-2 width-fill container-fluid", children: _jsxs(Row, { className: "", children: [_jsxs(Col, { md: 6, xs: 12, className: "d-flex flex-row align-items-center", children: [_jsxs("div", { className: "min-width-0 me-md-2", children: [_jsx("a", { className: "font-small single-line-ellipsis", target: "_blank", href: inputExplorer == null || txIdInput == null ? null : inputExplorer + txIdInput, children: txIdInput || "None" }), _jsxs("span", { className: "d-flex align-items-center font-weight-500 my-1", children: [_jsx("img", { src: inputCurrency.icon, className: "currency-icon-medium" }), inputAmount == null ? "???" : toHumanReadableString(inputAmount, inputCurrency), " ", inputCurrency.ticker, inputInfo != null ? (_jsx(OverlayTrigger, { overlay: _jsx(Tooltip, { id: "explorer-tooltip-in-" + row.id, children: inputInfo }), children: _jsx(Badge, { bg: "primary", className: "ms-2 pill-round px-2", pill: true, children: "?" }) })) : ""] }), _jsx("small", { className: "single-line-ellipsis", children: inputAddress })] }), _jsx(Icon, { size: 22, icon: ic_arrow_forward, className: "d-md-block d-none", style: { marginLeft: "auto", marginRight: "-22px", marginBottom: "6px" } })] }), _jsx(Col, { md: 0, xs: 12, className: "d-md-none d-flex justify-content-center", children: _jsx(Icon, { size: 22, icon: ic_arrow_downward, className: "", style: { marginBottom: "6px" } }) }), _jsxs(Col, { md: 6, xs: 12, className: "ps-md-4", children: [_jsx("a", { className: "font-small single-line-ellipsis", target: "_blank", href: outputExplorer == null || txIdOutput == null ? null : outputExplorer + txIdOutput, children: txIdOutput || "..." }), _jsxs("span", { className: "d-flex align-items-center font-weight-500 my-1", children: [_jsx("img", { src: outputCurrency.icon, className: "currency-icon-medium" }), outputAmount == null ? "???" : toHumanReadableString(outputAmount, outputCurrency), " ", outputCurrency.ticker, outputInfo != null ? (_jsx(OverlayTrigger, { overlay: _jsx(Tooltip, { id: "explorer-tooltip-out-" + row.id, children: outputInfo }), children: _jsx(Badge, { bg: "primary", className: "ms-2 pill-round px-2", pill: true, children: "?" }) })) : ""] }), _jsx("small", { className: "single-line-ellipsis", children: outputAddress })] })] }) }) })] }));
                        }
                    }, endpoint: FEConstants.statsUrl + "/GetSwapList", itemsPerPage: 10, refreshFunc: refreshTable, additionalData: additionalData }) })] }));
}

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { SwapType } from "sollightning-sdk";
import { Button, Card, Spinner } from "react-bootstrap";
import { useEffect, useRef, useState } from "react";
import ValidatedInput from "./ValidatedInput";
import BigNumber from "bignumber.js";
import { bitcoinCurrencies, btcCurrency, fromHumanReadableString, smartChainCurrencies, toHumanReadable, toHumanReadableString } from "../utils/Currencies";
import { CurrencyDropdown } from "./CurrencyDropdown";
import { SimpleFeeSummaryScreen } from "./SimpleFeeScreen";
import { QuoteSummary } from "./QuoteSummary";
export function SwapTab(props) {
    const [inCurrency, setInCurrency] = useState(btcCurrency);
    const [inAmount, setInAmount] = useState("");
    const inAmountRef = useRef();
    const [inDisabled, setInDisable] = useState(false);
    const [btcAmountConstraints, setBtcAmountConstraints] = useState({
        min: new BigNumber("0.00001"),
        max: null
    });
    const [outCurrency, setOutCurrency] = useState(smartChainCurrencies[0]);
    const [outAmount, setOutAmount] = useState("");
    const outAmountRef = useRef();
    const [outDisabled, setOutDisable] = useState(false);
    const [kind, setKind] = useState("frombtc");
    const [exactIn, setExactIn] = useState(true);
    const [address, setAddress] = useState();
    const addressRef = useRef();
    const [quote, setQuote] = useState();
    const [quoteError, setQuoteError] = useState();
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [locked, setLocked] = useState(false);
    useEffect(() => {
        if (props.swapper == null) {
            setBtcAmountConstraints({
                min: new BigNumber("0.00001"),
                max: null
            });
            return;
        }
        if ((inCurrency === null || inCurrency === void 0 ? void 0 : inCurrency.ticker) === "BTC") {
            setBtcAmountConstraints({
                min: toHumanReadable(props.swapper.getMinimum(SwapType.FROM_BTC), inCurrency),
                max: toHumanReadable(props.swapper.getMaximum(SwapType.FROM_BTC), inCurrency),
            });
        }
        if ((inCurrency === null || inCurrency === void 0 ? void 0 : inCurrency.ticker) === "BTC-LN") {
            setBtcAmountConstraints({
                min: toHumanReadable(props.swapper.getMinimum(SwapType.FROM_BTCLN), inCurrency),
                max: toHumanReadable(props.swapper.getMaximum(SwapType.FROM_BTCLN), inCurrency),
            });
        }
        if ((outCurrency === null || outCurrency === void 0 ? void 0 : outCurrency.ticker) === "BTC") {
            setBtcAmountConstraints({
                min: toHumanReadable(props.swapper.getMinimum(SwapType.TO_BTC), outCurrency),
                max: toHumanReadable(props.swapper.getMaximum(SwapType.TO_BTC), outCurrency),
            });
        }
        if ((outCurrency === null || outCurrency === void 0 ? void 0 : outCurrency.ticker) === "BTC-LN") {
            setBtcAmountConstraints({
                min: toHumanReadable(props.swapper.getMinimum(SwapType.TO_BTCLN), outCurrency),
                max: toHumanReadable(props.swapper.getMaximum(SwapType.TO_BTCLN), outCurrency),
            });
        }
    }, [inCurrency, outCurrency, props.swapper]);
    const changeDirection = () => {
        if (locked)
            return;
        if (kind === "frombtc") {
            setInAmount("");
            setOutAmount(inAmount);
            setKind("tobtc");
            setExactIn(false);
        }
        else {
            setOutAmount("");
            setInAmount(outAmount);
            setKind("frombtc");
            setExactIn(true);
        }
        setInCurrency(outCurrency);
        setOutCurrency(inCurrency);
        setAddress("");
    };
    const quoteUpdates = useRef(0);
    const currentQuotation = useRef(Promise.resolve());
    const getQuote = async () => {
        quoteUpdates.current++;
        const updateNum = quoteUpdates.current;
        setQuote(null);
        setQuoteError(null);
        if ((inCurrency === null || inCurrency === void 0 ? void 0 : inCurrency.ticker) === "BTC") {
            if (!inAmountRef.current.validate())
                return;
        }
        if ((inCurrency === null || inCurrency === void 0 ? void 0 : inCurrency.ticker) === "BTC-LN") {
            if (!inAmountRef.current.validate())
                return;
        }
        if ((outCurrency === null || outCurrency === void 0 ? void 0 : outCurrency.ticker) === "BTC") {
            if (!outAmountRef.current.validate())
                return;
            if (!addressRef.current.validate())
                return;
        }
        if ((outCurrency === null || outCurrency === void 0 ? void 0 : outCurrency.ticker) === "BTC-LN") {
            if (!outAmountRef.current.validate())
                return;
            if (!addressRef.current.validate())
                return;
        }
        const process = () => {
            if (quoteUpdates.current !== updateNum) {
                return;
            }
            setQuoteLoading(true);
            let promise;
            if ((inCurrency === null || inCurrency === void 0 ? void 0 : inCurrency.ticker) === "BTC") {
                promise = props.swapper.createFromBTCSwap(outCurrency.address, fromHumanReadableString(inAmount, inCurrency));
            }
            if ((inCurrency === null || inCurrency === void 0 ? void 0 : inCurrency.ticker) === "BTC-LN") {
                promise = props.swapper.createFromBTCLNSwap(outCurrency.address, fromHumanReadableString(inAmount, inCurrency));
            }
            if ((outCurrency === null || outCurrency === void 0 ? void 0 : outCurrency.ticker) === "BTC") {
                promise = props.swapper.createToBTCSwap(inCurrency.address, address, fromHumanReadableString(outAmount, outCurrency));
            }
            if ((outCurrency === null || outCurrency === void 0 ? void 0 : outCurrency.ticker) === "BTC-LN") {
                promise = props.swapper.createToBTCLNSwap(inCurrency.address, address, 5 * 24 * 60 * 60);
            }
            currentQuotation.current = promise.then((swap) => {
                if (quoteUpdates.current !== updateNum) {
                    return;
                }
                setQuoteLoading(false);
                setQuote(swap);
            }).catch(e => {
                if (quoteUpdates.current !== updateNum) {
                    return;
                }
                setQuoteLoading(false);
                setQuoteError(e.toString());
            });
        };
        currentQuotation.current.then(process, process);
    };
    useEffect(() => {
        setQuote(null);
        if (props.swapper == null)
            return;
        if (inCurrency == null)
            return;
        if (outCurrency == null)
            return;
        getQuote();
    }, [outAmount, inAmount, inCurrency, outCurrency, exactIn, props.swapper]);
    return (_jsx("div", Object.assign({ className: "d-flex flex-column flex-fill align-items-center bg-dark text-white" }, { children: _jsxs(Card, Object.assign({ className: "p-3 swap-panel border-0" }, { children: [_jsxs(Card, Object.assign({ className: "d-flex flex-row bg-dark bg-opacity-10 border-0 p-3" }, { children: [_jsx(ValidatedInput, { disabled: locked || inDisabled, inputRef: inAmountRef, className: "flex-fill strip-group-text", type: "number", value: kind === "tobtc" ? (quote == null ? "" : toHumanReadableString(quote.getInAmount(), inCurrency)) : inAmount, size: "lg", textStart: kind === "tobtc" && quoteLoading ? (_jsx(Spinner, { size: "sm" })) : null, onChange: val => {
                                if (kind === "tobtc")
                                    return;
                                setInAmount(val);
                                setExactIn(true);
                            }, step: inCurrency == null ? new BigNumber("0.00000001") : new BigNumber(10).pow(new BigNumber(-inCurrency.decimals)), min: kind === "frombtc" ? btcAmountConstraints.min : new BigNumber(0), max: kind === "frombtc" ? btcAmountConstraints.max : null, onValidate: (val) => {
                                return val === "" ? "Amount cannot be empty" : null;
                            } }), _jsx(CurrencyDropdown, { currencyList: kind === "frombtc" ? bitcoinCurrencies : props.supportedCurrencies, onSelect: val => {
                                if (locked)
                                    return;
                                setInCurrency(val);
                            }, value: inCurrency })] })), _jsx("div", Object.assign({ className: "d-flex justify-content-center swap-direction-wrapper" }, { children: _jsx(Button, Object.assign({ onClick: changeDirection, size: "lg", className: "px-0 swap-direction-btn" }, { children: "\u2193" })) })), _jsxs(Card, Object.assign({ className: "bg-dark bg-opacity-10 border-0 p-3" }, { children: [_jsxs("div", Object.assign({ className: "d-flex flex-row" }, { children: [_jsx(ValidatedInput, { disabled: locked || outDisabled, inputRef: outAmountRef, className: "flex-fill strip-group-text", type: "number", value: kind === "frombtc" ? (quote == null ? "" : toHumanReadableString(quote.getOutAmount(), outCurrency)) : outAmount, size: "lg", textStart: kind === "frombtc" && quoteLoading ? (_jsx(Spinner, { size: "sm" })) : null, onChange: val => {
                                        if (kind === "frombtc")
                                            return;
                                        setOutAmount(val);
                                        setExactIn(false);
                                    }, step: outCurrency == null ? new BigNumber("0.00000001") : new BigNumber(10).pow(new BigNumber(-outCurrency.decimals)), min: kind === "tobtc" ? btcAmountConstraints.min : new BigNumber(0), max: kind === "tobtc" ? btcAmountConstraints.max : null, onValidate: (val) => {
                                        return val === "" ? "Amount cannot be empty" : null;
                                    } }), _jsx(CurrencyDropdown, { currencyList: kind === "tobtc" ? bitcoinCurrencies : props.supportedCurrencies, onSelect: (val) => {
                                        if (locked)
                                            return;
                                        setOutCurrency(val);
                                        if (kind === "tobtc" && val !== outCurrency) {
                                            setOutDisable(false);
                                            setAddress("");
                                        }
                                    }, value: outCurrency })] })), kind === "tobtc" ? (_jsx(ValidatedInput, { type: "text", className: "flex-fill mt-3", value: address, onChange: (val) => {
                                setAddress(val);
                                if (props.swapper.isValidBitcoinAddress(val)) {
                                    setOutCurrency(bitcoinCurrencies[0]);
                                    setOutDisable(false);
                                    if (outAmountRef.current.validate()) {
                                        const currentAmt = fromHumanReadableString(outAmount, bitcoinCurrencies[0]);
                                        const min = props.swapper.getMinimum(SwapType.TO_BTC);
                                        const max = props.swapper.getMaximum(SwapType.TO_BTC);
                                        if (currentAmt.lt(min)) {
                                            setOutAmount(toHumanReadableString(min, bitcoinCurrencies[0]));
                                        }
                                        if (currentAmt.gt(max)) {
                                            setOutAmount(toHumanReadableString(max, bitcoinCurrencies[0]));
                                        }
                                    }
                                }
                                if (props.swapper.isValidLightningInvoice(val)) {
                                    setOutCurrency(bitcoinCurrencies[1]);
                                    const outAmt = props.swapper.getLightningInvoiceValue(val);
                                    setOutAmount(toHumanReadableString(outAmt, btcCurrency));
                                    setOutDisable(true);
                                }
                            }, inputRef: addressRef, placeholder: "Paste Bitcoin/Lightning address", onValidate: (val) => {
                                return props.swapper.isValidBitcoinAddress(val) || props.swapper.isValidLightningInvoice(val) ? null
                                    : "Invalid bitcoin address/lightning network invoice";
                            } })) : ""] })), quote != null ? (_jsxs(_Fragment, { children: [_jsx("div", Object.assign({ className: "mt-3" }, { children: _jsx(SimpleFeeSummaryScreen, { swap: quote }) })), _jsx("div", Object.assign({ className: "mt-3" }, { children: _jsx(QuoteSummary, { quote: quote, refreshQuote: getQuote, setAmountLock: setLocked }) }))] })) : ""] })) })));
}

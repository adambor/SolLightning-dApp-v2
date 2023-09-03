import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { FromBTCSwap, IFromBTCSwap, IToBTCSwap, SwapType, ToBTCSwap } from "sollightning-sdk";
import { Button, Card, Spinner } from "react-bootstrap";
import { useEffect, useRef, useState } from "react";
import ValidatedInput from "../ValidatedInput";
import BigNumber from "bignumber.js";
import { bitcoinCurrencies, btcCurrency, fromHumanReadableString, getCurrencySpec, smartChainCurrencies, toHumanReadable, toHumanReadableString } from "../../utils/Currencies";
import { CurrencyDropdown } from "../CurrencyDropdown";
import { SimpleFeeSummaryScreen } from "../SimpleFeeScreen";
import { QuoteSummary } from "../QuoteSummary";
import { Topbar } from "../Topbar";
import { useLocation, useNavigate } from "react-router-dom";
export function SwapTab(props) {
    const [inCurrency, setInCurrency] = useState(btcCurrency);
    const [outCurrency, setOutCurrency] = useState(smartChainCurrencies[0]);
    const [amount, setAmount] = useState("");
    const inAmountRef = useRef();
    const outAmountRef = useRef();
    const [disabled, setDisabled] = useState(false);
    const [btcAmountConstraints, setBtcAmountConstraints] = useState({
        min: new BigNumber("0.00001"),
        max: null
    });
    const [kind, setKind] = useState("frombtc");
    const [exactIn, setExactIn] = useState(true);
    const [address, setAddress] = useState();
    const addressRef = useRef();
    const [quote, setQuote] = useState();
    const [quoteError, setQuoteError] = useState();
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [locked, setLocked] = useState(false);
    const { search } = useLocation();
    const params = new URLSearchParams(search);
    const propSwapId = params.get("swapId");
    const [doValidate, setDoValidate] = useState();
    const navigate = useNavigate();
    useEffect(() => {
        if (!doValidate)
            return;
        outAmountRef.current.validate();
        inAmountRef.current.validate();
        setDoValidate(false);
    }, [doValidate]);
    useEffect(() => {
        if (props.swapper == null || propSwapId == null)
            return;
        props.swapper.getAllSwaps().then(res => {
            const foundSwap = res.find(e => e.getPaymentHash().toString("hex") === propSwapId);
            if (foundSwap != null) {
                setLocked(true);
                setQuote(foundSwap);
                if (foundSwap instanceof IToBTCSwap) {
                    const inCurr = getCurrencySpec(foundSwap.getToken());
                    const outCurr = foundSwap instanceof ToBTCSwap ? bitcoinCurrencies[0] : bitcoinCurrencies[1];
                    setInCurrency(inCurr);
                    setOutCurrency(outCurr);
                    setAmount(toHumanReadableString(foundSwap.getOutAmount(), outCurr));
                    setAddress(foundSwap.getAddress());
                    setKind("tobtc");
                    setExactIn(false);
                }
                else if (foundSwap instanceof IFromBTCSwap) {
                    const inCurr = foundSwap instanceof FromBTCSwap ? bitcoinCurrencies[0] : bitcoinCurrencies[1];
                    const outCurr = getCurrencySpec(foundSwap.getToken());
                    setInCurrency(inCurr);
                    setOutCurrency(outCurr);
                    setAmount(toHumanReadableString(foundSwap.getInAmount(), inCurr));
                    setKind("frombtc");
                    setExactIn(true);
                }
                setDoValidate(true);
            }
            navigate("/");
        });
    }, [propSwapId, props.swapper]);
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
        setDoValidate(true);
    }, [inCurrency, outCurrency, props.swapper]);
    const changeDirection = () => {
        if (locked)
            return;
        if (kind === "frombtc") {
            setKind("tobtc");
            setExactIn(false);
        }
        else {
            setKind("frombtc");
            setExactIn(true);
        }
        setInCurrency(outCurrency);
        setOutCurrency(inCurrency);
        setDisabled(false);
        setAddress("");
    };
    const quoteUpdates = useRef(0);
    const currentQuotation = useRef(Promise.resolve());
    const getQuote = async () => {
        quoteUpdates.current++;
        const updateNum = quoteUpdates.current;
        setQuote(null);
        setQuoteError(null);
        setQuoteLoading(false);
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
            //TODO: ENable if we want to support LNURL
            //if(!outAmountRef.current.validate()) return;
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
                promise = props.swapper.createFromBTCSwap(outCurrency.address, fromHumanReadableString(amount, inCurrency));
            }
            if ((inCurrency === null || inCurrency === void 0 ? void 0 : inCurrency.ticker) === "BTC-LN") {
                promise = props.swapper.createFromBTCLNSwap(outCurrency.address, fromHumanReadableString(amount, inCurrency));
            }
            if ((outCurrency === null || outCurrency === void 0 ? void 0 : outCurrency.ticker) === "BTC") {
                promise = props.swapper.createToBTCSwap(inCurrency.address, address, fromHumanReadableString(amount, outCurrency));
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
        if (locked)
            return;
        setQuote(null);
        if (props.swapper == null)
            return;
        if (inCurrency == null)
            return;
        if (outCurrency == null)
            return;
        getQuote();
    }, [address, amount, inCurrency, outCurrency, exactIn, props.swapper]);
    return (_jsxs(_Fragment, { children: [_jsx(Topbar, { selected: 0, enabled: !locked }), _jsx("div", Object.assign({ className: "d-flex flex-column flex-fill align-items-center bg-dark text-white" }, { children: _jsxs(Card, Object.assign({ className: "p-3 swap-panel border-0 mx-3" }, { children: [_jsxs(Card, Object.assign({ className: "d-flex flex-row bg-dark bg-opacity-10 border-0 p-3" }, { children: [_jsx(ValidatedInput, { disabled: locked || (exactIn && disabled), inputRef: inAmountRef, className: "flex-fill strip-group-text", type: "number", value: kind === "tobtc" ? (quote == null ? "" : toHumanReadableString(quote.getInAmount(), inCurrency)) : amount, size: "lg", textStart: kind === "tobtc" && quoteLoading ? (_jsx(Spinner, { size: "sm" })) : null, onChange: val => {
                                        if (kind === "tobtc")
                                            return;
                                        setAmount(val);
                                        setExactIn(true);
                                    }, step: inCurrency == null ? new BigNumber("0.00000001") : new BigNumber(10).pow(new BigNumber(-inCurrency.decimals)), min: kind === "frombtc" ? btcAmountConstraints.min : new BigNumber(0), max: kind === "frombtc" ? btcAmountConstraints.max : null, onValidate: exactIn ? (val) => {
                                        return val === "" ? "Amount cannot be empty" : null;
                                    } : null }), _jsx(CurrencyDropdown, { currencyList: kind === "frombtc" ? bitcoinCurrencies : props.supportedCurrencies, onSelect: val => {
                                        if (locked)
                                            return;
                                        setInCurrency(val);
                                    }, value: inCurrency })] })), _jsx("div", Object.assign({ className: "d-flex justify-content-center swap-direction-wrapper" }, { children: _jsx(Button, Object.assign({ onClick: changeDirection, size: "lg", className: "px-0 swap-direction-btn" }, { children: "\u2193" })) })), _jsxs(Card, Object.assign({ className: "bg-dark bg-opacity-10 border-0 p-3" }, { children: [_jsxs("div", Object.assign({ className: "d-flex flex-row" }, { children: [_jsx(ValidatedInput, { disabled: locked || (!exactIn && disabled), inputRef: outAmountRef, className: "flex-fill strip-group-text", type: "number", value: kind === "frombtc" ? (quote == null ? "" : toHumanReadableString(quote.getOutAmount(), outCurrency)) : amount, size: "lg", textStart: kind === "frombtc" && quoteLoading ? (_jsx(Spinner, { size: "sm" })) : null, onChange: val => {
                                                if (kind === "frombtc")
                                                    return;
                                                setAmount(val);
                                                setExactIn(false);
                                            }, step: outCurrency == null ? new BigNumber("0.00000001") : new BigNumber(10).pow(new BigNumber(-outCurrency.decimals)), min: kind === "tobtc" ? btcAmountConstraints.min : new BigNumber(0), max: kind === "tobtc" ? btcAmountConstraints.max : null, onValidate: !exactIn ? (val) => {
                                                return val === "" ? "Amount cannot be empty" : null;
                                            } : null }), _jsx(CurrencyDropdown, { currencyList: kind === "tobtc" ? bitcoinCurrencies : props.supportedCurrencies, onSelect: (val) => {
                                                if (locked)
                                                    return;
                                                setOutCurrency(val);
                                                if (kind === "tobtc" && val !== outCurrency) {
                                                    setDisabled(false);
                                                    setAddress("");
                                                }
                                            }, value: outCurrency })] })), kind === "tobtc" ? (_jsx(ValidatedInput, { type: "text", className: "flex-fill mt-3", value: address, onChange: (val) => {
                                        setAddress(val);
                                        if (props.swapper.isValidBitcoinAddress(val)) {
                                            setOutCurrency(bitcoinCurrencies[0]);
                                            setDisabled(false);
                                            if (outAmountRef.current.validate()) {
                                                const currentAmt = fromHumanReadableString(amount, bitcoinCurrencies[0]);
                                                const min = props.swapper.getMinimum(SwapType.TO_BTC);
                                                const max = props.swapper.getMaximum(SwapType.TO_BTC);
                                                if (currentAmt.lt(min)) {
                                                    setAmount(toHumanReadableString(min, bitcoinCurrencies[0]));
                                                }
                                                if (currentAmt.gt(max)) {
                                                    setAmount(toHumanReadableString(max, bitcoinCurrencies[0]));
                                                }
                                            }
                                        }
                                        if (props.swapper.isValidLightningInvoice(val)) {
                                            setOutCurrency(bitcoinCurrencies[1]);
                                            const outAmt = props.swapper.getLightningInvoiceValue(val);
                                            setAmount(toHumanReadableString(outAmt, btcCurrency));
                                            setDisabled(true);
                                            return;
                                        }
                                        setDisabled(false);
                                    }, inputRef: addressRef, placeholder: "Paste Bitcoin/Lightning address", onValidate: (val) => {
                                        return props.swapper.isValidBitcoinAddress(val) || props.swapper.isValidLightningInvoice(val) ? null
                                            : "Invalid bitcoin address/lightning network invoice";
                                    } })) : ""] })), quote != null ? (_jsxs(_Fragment, { children: [_jsx("div", Object.assign({ className: "mt-3" }, { children: _jsx(SimpleFeeSummaryScreen, { swap: quote }) })), _jsx("div", Object.assign({ className: "mt-3" }, { children: _jsx(QuoteSummary, { quote: quote, refreshQuote: getQuote, setAmountLock: setLocked }) }))] })) : ""] })) }))] }));
}

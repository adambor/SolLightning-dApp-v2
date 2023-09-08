import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { FromBTCSwap, IFromBTCSwap, IToBTCSwap, SwapType, ToBTCSwap } from "sollightning-sdk";
import { Alert, Button, Card, Spinner } from "react-bootstrap";
import { useEffect, useRef, useState } from "react";
import ValidatedInput from "../ValidatedInput";
import BigNumber from "bignumber.js";
import { bitcoinCurrencies, btcCurrency, fromHumanReadableString, getCurrencySpec, smartChainCurrencies, toHumanReadable, toHumanReadableString } from "../../utils/Currencies";
import { CurrencyDropdown } from "../CurrencyDropdown";
import { SimpleFeeSummaryScreen } from "../SimpleFeeScreen";
import { QuoteSummary } from "../quotes/QuoteSummary";
import { Topbar } from "../Topbar";
import { useLocation, useNavigate } from "react-router-dom";
const defaultConstraints = {
    min: new BigNumber("0.000001"),
    max: null
};
export function SwapTab(props) {
    const [inCurrency, setInCurrency] = useState(btcCurrency);
    const [outCurrency, setOutCurrency] = useState(smartChainCurrencies[0]);
    const [amount, setAmount] = useState("");
    const inAmountRef = useRef();
    const outAmountRef = useRef();
    const [disabled, setDisabled] = useState(false);
    const [btcAmountConstraints, setBtcAmountConstraints] = useState();
    const [tokenConstraints, setTokenConstraints] = useState();
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
    let swapType;
    if ((outCurrency === null || outCurrency === void 0 ? void 0 : outCurrency.ticker) === "BTC")
        swapType = SwapType.TO_BTC;
    if ((outCurrency === null || outCurrency === void 0 ? void 0 : outCurrency.ticker) === "BTC-LN")
        swapType = SwapType.TO_BTCLN;
    if ((inCurrency === null || inCurrency === void 0 ? void 0 : inCurrency.ticker) === "BTC")
        swapType = SwapType.FROM_BTC;
    if ((inCurrency === null || inCurrency === void 0 ? void 0 : inCurrency.ticker) === "BTC-LN")
        swapType = SwapType.FROM_BTCLN;
    let kind;
    if (swapType === SwapType.TO_BTC || swapType === SwapType.TO_BTCLN) {
        kind = "tobtc";
    }
    else {
        kind = "frombtc";
    }
    let inConstraints;
    let outConstraints;
    if (exactIn) {
        outConstraints = defaultConstraints;
        if (kind === "frombtc") {
            inConstraints = btcAmountConstraints == null ? defaultConstraints : (btcAmountConstraints[swapType] || defaultConstraints);
        }
        else {
            const constraint = tokenConstraints == null ? null : tokenConstraints[inCurrency.address.toString()];
            if (constraint != null) {
                inConstraints = constraint[swapType] || defaultConstraints;
            }
            else {
                inConstraints = defaultConstraints;
            }
        }
    }
    else { //exact out
        inConstraints = defaultConstraints;
        if (kind === "frombtc") {
            const constraint = tokenConstraints == null ? null : tokenConstraints[outCurrency.address.toString()];
            if (constraint != null) {
                outConstraints = constraint[swapType] || defaultConstraints;
            }
            else {
                outConstraints = defaultConstraints;
            }
        }
        else { //tobtc
            outConstraints = btcAmountConstraints == null ? defaultConstraints : (btcAmountConstraints[swapType] || defaultConstraints);
        }
    }
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
                    setExactIn(false);
                }
                else if (foundSwap instanceof IFromBTCSwap) {
                    const inCurr = foundSwap instanceof FromBTCSwap ? bitcoinCurrencies[0] : bitcoinCurrencies[1];
                    const outCurr = getCurrencySpec(foundSwap.getToken());
                    setInCurrency(inCurr);
                    setOutCurrency(outCurr);
                    setAmount(toHumanReadableString(foundSwap.getInAmount(), inCurr));
                    setExactIn(true);
                }
                setDoValidate(true);
            }
            navigate("/");
        });
    }, [propSwapId, props.swapper]);
    useEffect(() => {
        if (props.swapper == null) {
            setBtcAmountConstraints(null);
            return;
        }
        const constraints = {};
        [SwapType.FROM_BTC, SwapType.TO_BTC, SwapType.FROM_BTCLN, SwapType.TO_BTCLN].forEach(swapType => constraints[swapType] = {
            min: toHumanReadable(props.swapper.getMinimum(swapType), btcCurrency),
            max: toHumanReadable(props.swapper.getMaximum(swapType), btcCurrency),
        });
        setBtcAmountConstraints(constraints);
        setDoValidate(true);
    }, [props.swapper]);
    const changeDirection = () => {
        if (locked)
            return;
        setExactIn(!exactIn);
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
        if (exactIn) {
            outAmountRef.current.validate();
            if (!inAmountRef.current.validate())
                return;
        }
        else {
            inAmountRef.current.validate();
            if (!outAmountRef.current.validate())
                return;
        }
        if ((outCurrency === null || outCurrency === void 0 ? void 0 : outCurrency.ticker) === "BTC") {
            if (!addressRef.current.validate())
                return;
        }
        if ((outCurrency === null || outCurrency === void 0 ? void 0 : outCurrency.ticker) === "BTC-LN") {
            if (!addressRef.current.validate())
                return;
        }
        const process = () => {
            if (quoteUpdates.current !== updateNum) {
                return;
            }
            setQuoteLoading(true);
            let promise;
            let tokenCurrency;
            let quoteCurrency;
            if ((inCurrency === null || inCurrency === void 0 ? void 0 : inCurrency.ticker) === "BTC") {
                tokenCurrency = outCurrency;
                quoteCurrency = exactIn ? inCurrency : outCurrency;
                promise = props.swapper.createFromBTCSwap(outCurrency.address, fromHumanReadableString(amount, quoteCurrency), !exactIn);
            }
            if ((inCurrency === null || inCurrency === void 0 ? void 0 : inCurrency.ticker) === "BTC-LN") {
                tokenCurrency = outCurrency;
                quoteCurrency = exactIn ? inCurrency : outCurrency;
                promise = props.swapper.createFromBTCLNSwap(outCurrency.address, fromHumanReadableString(amount, quoteCurrency), !exactIn);
            }
            if ((outCurrency === null || outCurrency === void 0 ? void 0 : outCurrency.ticker) === "BTC") {
                tokenCurrency = inCurrency;
                quoteCurrency = exactIn ? inCurrency : outCurrency;
                promise = props.swapper.createToBTCSwap(inCurrency.address, address, fromHumanReadableString(amount, quoteCurrency), null, null, exactIn);
            }
            if ((outCurrency === null || outCurrency === void 0 ? void 0 : outCurrency.ticker) === "BTC-LN") {
                tokenCurrency = inCurrency;
                quoteCurrency = outCurrency;
                promise = props.swapper.createToBTCLNSwap(inCurrency.address, address, 5 * 24 * 60 * 60);
            }
            currentQuotation.current = promise.then((swap) => {
                if (quoteUpdates.current !== updateNum) {
                    return;
                }
                setQuoteLoading(false);
                setQuote(swap);
                //TODO: Check if the user has enough lamports to cover solana transaction fees
            }).catch(e => {
                let doSetError = true;
                if (e.min != null && e.max != null) {
                    if (tokenCurrency === quoteCurrency) {
                        setTokenConstraints(val => {
                            if (val == null)
                                val = {};
                            if (val[tokenCurrency.address.toString()] == null)
                                val[tokenCurrency.address.toString()] = {};
                            val[tokenCurrency.address.toString()][swapType] = {
                                min: toHumanReadable(e.min, tokenCurrency),
                                max: toHumanReadable(e.max, tokenCurrency)
                            };
                            console.log(val);
                            return val;
                        });
                        doSetError = false;
                    }
                }
                if (quoteUpdates.current !== updateNum) {
                    return;
                }
                setDoValidate(true);
                setQuoteLoading(false);
                if (doSetError)
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
    return (_jsxs(_Fragment, { children: [_jsx(Topbar, { selected: 0, enabled: !locked }), _jsx("div", Object.assign({ className: "d-flex flex-column flex-fill align-items-center bg-dark text-white" }, { children: _jsxs(Card, Object.assign({ className: "p-3 swap-panel border-0 mx-3" }, { children: [_jsxs(Alert, Object.assign({ show: quoteError != null, variant: "danger", onClose: () => setQuoteError(null), dismissible: true, closeVariant: "white" }, { children: [_jsx("strong", { children: "Quoting error" }), _jsx("label", { children: quoteError })] })), _jsxs(Card, Object.assign({ className: "d-flex flex-row bg-dark bg-opacity-10 border-0 p-3" }, { children: [_jsx(ValidatedInput, { disabled: locked || disabled, inputRef: inAmountRef, className: "flex-fill strip-group-text", type: "number", value: !exactIn ? (quote == null ? "" : toHumanReadableString(quote.getInAmount(), inCurrency)) : amount, size: "lg", textStart: !exactIn && quoteLoading ? (_jsx(Spinner, { size: "sm" })) : null, onChange: val => {
                                        setAmount(val);
                                        setExactIn(true);
                                    }, step: inCurrency == null ? new BigNumber("0.00000001") : new BigNumber(10).pow(new BigNumber(-inCurrency.decimals)), min: inConstraints.min, max: inConstraints.max, onValidate: (val) => {
                                        return exactIn && val === "" ? "Amount cannot be empty" : null;
                                    } }), _jsx(CurrencyDropdown, { currencyList: kind === "frombtc" ? bitcoinCurrencies : props.supportedCurrencies, onSelect: val => {
                                        if (locked)
                                            return;
                                        setInCurrency(val);
                                    }, value: inCurrency })] })), _jsx("div", Object.assign({ className: "d-flex justify-content-center swap-direction-wrapper" }, { children: _jsx(Button, Object.assign({ onClick: changeDirection, size: "lg", className: "px-0 swap-direction-btn" }, { children: "\u2193" })) })), _jsxs(Card, Object.assign({ className: "bg-dark bg-opacity-10 border-0 p-3" }, { children: [_jsxs("div", Object.assign({ className: "d-flex flex-row" }, { children: [_jsx(ValidatedInput, { disabled: locked || disabled, inputRef: outAmountRef, className: "flex-fill strip-group-text", type: "number", value: exactIn ? (quote == null ? "" : toHumanReadableString(quote.getOutAmount(), outCurrency)) : amount, size: "lg", textStart: exactIn && quoteLoading ? (_jsx(Spinner, { size: "sm" })) : null, onChange: val => {
                                                setAmount(val);
                                                setExactIn(false);
                                            }, step: outCurrency == null ? new BigNumber("0.00000001") : new BigNumber(10).pow(new BigNumber(-outCurrency.decimals)), min: outConstraints.min, max: outConstraints.max, onValidate: (val) => {
                                                return !exactIn && val === "" ? "Amount cannot be empty" : null;
                                            } }), _jsx(CurrencyDropdown, { currencyList: kind === "tobtc" ? bitcoinCurrencies : props.supportedCurrencies, onSelect: (val) => {
                                                if (locked)
                                                    return;
                                                setOutCurrency(val);
                                                if (kind === "tobtc" && val !== outCurrency) {
                                                    setDisabled(false);
                                                    setAddress("");
                                                }
                                            }, value: outCurrency })] })), kind === "tobtc" ? (_jsxs(_Fragment, { children: [_jsx(ValidatedInput, { type: "text", className: "flex-fill mt-3", value: address, onChange: (val) => {
                                                setAddress(val);
                                                if (props.swapper.isValidLNURL(val)) {
                                                    props.swapper.getLNURLTypeAndData(val).then(() => {
                                                        navigate("/scan/2?address=" + encodeURIComponent(val));
                                                    }).catch(e => { });
                                                }
                                                if (props.swapper.isValidBitcoinAddress(val)) {
                                                    setOutCurrency(bitcoinCurrencies[0]);
                                                    setDisabled(false);
                                                    // if(outAmountRef.current.validate()) {
                                                    //     const currentAmt = fromHumanReadableString(amount, bitcoinCurrencies[0]);
                                                    //     const min = props.swapper.getMinimum(SwapType.TO_BTC);
                                                    //     const max = props.swapper.getMaximum(SwapType.TO_BTC);
                                                    //     if(currentAmt.lt(min)) {
                                                    //         setAmount(toHumanReadableString(min, bitcoinCurrencies[0]));
                                                    //     }
                                                    //     if(currentAmt.gt(max)) {
                                                    //         setAmount(toHumanReadableString(max, bitcoinCurrencies[0]));
                                                    //     }
                                                    // }
                                                }
                                                if (props.swapper.isValidLightningInvoice(val)) {
                                                    setOutCurrency(bitcoinCurrencies[1]);
                                                    const outAmt = props.swapper.getLightningInvoiceValue(val);
                                                    setAmount(toHumanReadableString(outAmt, btcCurrency));
                                                    setExactIn(false);
                                                    setDisabled(true);
                                                    return;
                                                }
                                                setDisabled(false);
                                            }, inputRef: addressRef, placeholder: "Paste Bitcoin/Lightning address", onValidate: (val) => {
                                                return props.swapper.isValidLNURL(val) || props.swapper.isValidBitcoinAddress(val) || props.swapper.isValidLightningInvoice(val) ? null
                                                    : "Invalid bitcoin address/lightning network invoice";
                                            } }), outCurrency === bitcoinCurrencies[1] ? (_jsx(Alert, Object.assign({ variant: "success", className: "mt-3 mb-0" }, { children: _jsx("label", { children: "We only support lightning network invoices with pre-set amount!" }) }))) : ""] })) : ""] })), quote != null ? (_jsxs(_Fragment, { children: [_jsx("div", Object.assign({ className: "mt-3" }, { children: _jsx(SimpleFeeSummaryScreen, { swap: quote }) })), _jsx("div", Object.assign({ className: "mt-3 d-flex flex-column" }, { children: _jsx(QuoteSummary, { quote: quote, refreshQuote: getQuote, setAmountLock: setLocked, abortSwap: () => {
                                            setLocked(false);
                                            setQuote(null);
                                            setAmount("");
                                        } }) }))] })) : ""] })) }))] }));
}

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import ValidatedInput from "../ValidatedInput";
import { CurrencyDropdown } from "../CurrencyDropdown";
import { useEffect, useRef, useState } from "react";
import { FeeSummaryScreen } from "../FeeSummaryScreen";
import { Alert, Badge, Button, Form, OverlayTrigger, Spinner, Tooltip } from "react-bootstrap";
import { SolanaSwapper, SwapType } from "sollightning-sdk";
import BigNumber from "bignumber.js";
import * as BN from "bn.js";
import { btcCurrency, fromHumanReadable, smartChainCurrencies, toHumanReadable } from "../../utils/Currencies";
import { QuoteSummary } from "../quotes/QuoteSummary";
import { useLocation, useNavigate } from "react-router-dom";
import { Topbar } from "../Topbar";
const balanceExpiryTime = 30000;
export function Step2Screen(props) {
    const navigate = useNavigate();
    const { search, state } = useLocation();
    const params = new URLSearchParams(search);
    const propAddress = params.get("address") || params.get("lightning");
    const stateLnurlParams = (state === null || state === void 0 ? void 0 : state.lnurlParams) != null ? Object.assign(Object.assign({}, state.lnurlParams), { min: new BN(state.lnurlParams.min), max: new BN(state.lnurlParams.max) }) : null;
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [lnurlLoading, setLnurlLoading] = useState(false);
    const [addressError, setAddressError] = useState(null);
    const [address, setAddress] = useState(null);
    const [isLnurl, setLnurl] = useState(false);
    const [amountConstraints, setAmountConstraints] = useState(null);
    const [amount, setAmount] = useState(null);
    const amountRef = useRef();
    const [lnurlParams, setLnurlParams] = useState(null);
    const computedLnurlParams = stateLnurlParams || lnurlParams;
    const [type, setType] = useState("send");
    const [network, setNetwork] = useState("ln");
    const [quoteLoading, setQuoteLoading] = useState(null);
    const [quoteError, setQuoteError] = useState(null);
    const [quote, setQuote] = useState(null);
    const [isLocked, setLocked] = useState(false);
    const balanceCache = useRef({});
    const getBalance = async (tokenAddress) => {
        if (balanceCache.current[tokenAddress.toString()] == null || balanceCache.current[tokenAddress.toString()].balance == null || Date.now() - balanceCache.current[tokenAddress.toString()].timestamp > balanceExpiryTime) {
            balanceCache.current[tokenAddress.toString()] = {
                balance: await props.swapper.swapContract.getBalance(tokenAddress, false).catch(e => console.error(e)),
                timestamp: Date.now()
            };
        }
        return balanceCache.current[tokenAddress.toString()].balance;
    };
    useEffect(() => {
        const propToken = params.get("token");
        console.log("Prop token: ", propToken);
        if (propToken != null) {
            setSelectedCurrency(smartChainCurrencies.find(token => token.ticker === propToken));
        }
    }, []);
    const [autoContinue, setAutoContinue] = useState();
    useEffect(() => {
        const config = window.localStorage.getItem("crossLightning-autoContinue");
        setAutoContinue(config == null ? true : config === "true");
    }, []);
    const setAndSaveAutoContinue = (value) => {
        setAutoContinue(value);
        window.localStorage.setItem("crossLightning-autoContinue", "" + value);
    };
    useEffect(() => {
        console.log("Prop address: ", propAddress);
        if (propAddress == null) {
            navigate("/scan");
            return;
        }
        if (props.swapper != null) {
            let lightning = false;
            let resultText = propAddress;
            if (resultText.startsWith("lightning:")) {
                resultText = resultText.substring(10);
            }
            let _amount = null;
            if (resultText.startsWith("bitcoin:")) {
                resultText = resultText.substring(8);
                if (resultText.includes("?")) {
                    const arr = resultText.split("?");
                    resultText = arr[0];
                    const params = arr[1].split("&");
                    for (let param of params) {
                        const arr2 = param.split("=");
                        const key = arr2[0];
                        const value = decodeURIComponent(arr2[1]);
                        if (key === "amount") {
                            _amount = value;
                        }
                    }
                }
            }
            setAmountConstraints(null);
            setLnurlLoading(false);
            setAddressError(null);
            setLnurl(false);
            setAddress(resultText);
            if (props.swapper.isValidBitcoinAddress(resultText)) {
                //On-chain send
                setType("send");
                if (_amount != null) {
                    const amountBN = new BigNumber(_amount);
                    const amountSolBN = fromHumanReadable(amountBN, btcCurrency);
                    const min = props.swapper.getMinimum(SwapType.TO_BTC);
                    const max = props.swapper.getMaximum(SwapType.TO_BTC);
                    if (amountSolBN.lt(min)) {
                        setAddressError("Payment amount (" + amountBN.toString(10) + " BTC) is below minimum swappable amount (" + toHumanReadable(min, btcCurrency).toString(10) + " BTC)");
                        return;
                    }
                    if (amountSolBN.gt(max)) {
                        setAddressError("Payment amount (" + amountBN.toString(10) + " BTC) is above maximum swappable amount (" + toHumanReadable(max, btcCurrency).toString(10) + " BTC)");
                        return;
                    }
                    setAmountConstraints({
                        min: amountBN,
                        max: amountBN,
                    });
                    setAmount(amountBN.toString(10));
                }
                else {
                    const min = props.swapper.getMinimum(SwapType.TO_BTC);
                    const max = props.swapper.getMaximum(SwapType.TO_BTC);
                    setAmountConstraints({
                        min: toHumanReadable(min, btcCurrency),
                        max: toHumanReadable(max, btcCurrency),
                    });
                }
                setNetwork("btc");
                return;
            }
            if (props.swapper.isValidLightningInvoice(resultText)) {
                //Lightning send
                setType("send");
                const amountSolBN = props.swapper.getLightningInvoiceValue(resultText);
                const min = props.swapper.getMinimum(SwapType.TO_BTCLN);
                const max = props.swapper.getMaximum(SwapType.TO_BTCLN);
                if (amountSolBN.lt(min)) {
                    setAddressError("Payment amount (" + toHumanReadable(amountSolBN, btcCurrency).toString(10) + ") is below minimum swappable amount (" + toHumanReadable(min, btcCurrency).toString(10) + " BTC)");
                    return;
                }
                if (amountSolBN.gt(max)) {
                    setAddressError("Payment amount (" + toHumanReadable(amountSolBN, btcCurrency).toString(10) + ") is above maximum swappable amount (" + toHumanReadable(max, btcCurrency).toString(10) + " BTC)");
                    return;
                }
                setAmountConstraints({
                    min: toHumanReadable(amountSolBN, btcCurrency),
                    max: toHumanReadable(amountSolBN, btcCurrency),
                });
                setAmount(toHumanReadable(amountSolBN, btcCurrency).toString(10));
                setNetwork("ln");
                return;
            }
            if (props.swapper.isValidLNURL(resultText)) {
                //Check LNURL type
                setLnurlLoading(true);
                setLnurl(true);
                setNetwork("ln");
                const processLNURL = (result, doSetState) => {
                    console.log(result);
                    setLnurlLoading(false);
                    if (result == null) {
                        setAddressError("Invalid LNURL, cannot process");
                        return;
                    }
                    if (doSetState)
                        setLnurlParams(result);
                    if (result.type === "pay") {
                        setType("send");
                        const min = props.swapper.getMinimum(SwapType.TO_BTCLN);
                        const max = props.swapper.getMaximum(SwapType.TO_BTCLN);
                        if (result.min.gt(max)) {
                            setAddressError("Minimum payable amount (" + toHumanReadable(result.min, btcCurrency).toString(10) + " BTC) is above maximum swappable amount (" + toHumanReadable(max, btcCurrency).toString(10) + " BTC)");
                            return;
                        }
                        if (result.max.lt(min)) {
                            setAddressError("Maximum payable amount (" + toHumanReadable(result.max, btcCurrency).toString(10) + " BTC) is below minimum swappable amount (" + toHumanReadable(min, btcCurrency).toString(10) + " BTC)");
                            return;
                        }
                        setAmountConstraints({
                            min: toHumanReadable(BN.max(result.min, min), btcCurrency),
                            max: toHumanReadable(BN.min(result.max, max), btcCurrency),
                        });
                        setAmount(toHumanReadable(BN.max(result.min, min), btcCurrency).toString(10));
                    }
                    if (result.type === "withdraw") {
                        setType("receive");
                        const min = props.swapper.getMinimum(SwapType.FROM_BTCLN);
                        const max = props.swapper.getMaximum(SwapType.FROM_BTCLN);
                        if (result.min.gt(max)) {
                            setAddressError("Minimum withdrawable amount (" + toHumanReadable(result.min, btcCurrency).toString(10) + " BTC) is above maximum swappable amount (" + toHumanReadable(max, btcCurrency).toString(10) + " BTC)");
                            return;
                        }
                        if (result.max.lt(min)) {
                            setAddressError("Maximum withdrawable amount (" + toHumanReadable(result.max, btcCurrency).toString(10) + " BTC) is below minimum swappable amount (" + toHumanReadable(min, btcCurrency).toString(10) + " BTC)");
                            return;
                        }
                        setAmountConstraints({
                            min: toHumanReadable(BN.max(result.min, min), btcCurrency),
                            max: toHumanReadable(BN.min(result.max, max), btcCurrency),
                        });
                        setAmount(toHumanReadable(BN.min(result.max, max), btcCurrency).toString(10));
                    }
                    setNetwork("ln");
                };
                if (stateLnurlParams != null) {
                    console.log("LNurl params passed: ", stateLnurlParams);
                    processLNURL(stateLnurlParams, false);
                    return;
                }
                props.swapper.getLNURLTypeAndData(resultText).then(resp => processLNURL(resp, true)).catch((e) => {
                    setLnurlLoading(false);
                    setAddressError("Failed to contact LNURL service, check you internet connection and retry later.");
                });
                return;
            }
            try {
                if (SolanaSwapper.getLightningInvoiceValue(resultText) == null) {
                    setAddressError("Lightning invoice needs to contain a payment amount!");
                    return;
                }
            }
            catch (e) { }
            setAddressError("Invalid address, lightning invoice or LNURL!");
        }
    }, [propAddress, props.swapper]);
    const quoteUpdates = useRef(0);
    const currentQuotation = useRef(Promise.resolve());
    const getQuote = () => {
        if (amount != null && selectedCurrency != null) {
            setQuote(null);
            setQuoteError(null);
            quoteUpdates.current++;
            const updateNum = quoteUpdates.current;
            if (!amountRef.current.validate())
                return;
            const process = () => {
                if (quoteUpdates.current !== updateNum) {
                    return;
                }
                setQuoteLoading(true);
                let additionalParam;
                const affiliate = window.localStorage.getItem("atomiq-affiliate");
                if (affiliate != null) {
                    additionalParam = {
                        affiliate
                    };
                }
                let swapPromise;
                if (type === "send") {
                    if (network === "btc") {
                        swapPromise = props.swapper.createToBTCSwap(selectedCurrency.address, address, fromHumanReadable(new BigNumber(amount), btcCurrency), null, null, null, additionalParam);
                    }
                    if (network === "ln") {
                        if (isLnurl) {
                            swapPromise = props.swapper.createToBTCLNSwapViaLNURL(selectedCurrency.address, computedLnurlParams, fromHumanReadable(new BigNumber(amount), btcCurrency), "", 5 * 24 * 60 * 60, null, null, null, additionalParam);
                        }
                        else {
                            swapPromise = props.swapper.createToBTCLNSwap(selectedCurrency.address, address, 5 * 24 * 60 * 60, null, null, additionalParam);
                        }
                    }
                }
                else {
                    swapPromise = props.swapper.createFromBTCLNSwapViaLNURL(selectedCurrency.address, computedLnurlParams, fromHumanReadable(new BigNumber(amount), btcCurrency), true, additionalParam);
                }
                const balancePromise = getBalance(selectedCurrency.address);
                currentQuotation.current = Promise.all([swapPromise, balancePromise]).then((swapAndBalance) => {
                    if (quoteUpdates.current !== updateNum) {
                        return;
                    }
                    setQuoteLoading(false);
                    setQuote(swapAndBalance);
                }).catch(e => {
                    if (quoteUpdates.current !== updateNum) {
                        return;
                    }
                    setQuoteLoading(false);
                    setQuoteError(e.toString());
                });
            };
            currentQuotation.current.then(process, process);
        }
    };
    useEffect(() => {
        if (quote != null) {
            // @ts-ignore
            window.scrollBy(0, 99999);
        }
    }, [quote]);
    useEffect(() => {
        getQuote();
    }, [amount, selectedCurrency]);
    const goBack = () => {
        navigate("/scan");
    };
    return (_jsxs(_Fragment, { children: [_jsx(Topbar, { selected: 1, enabled: !isLocked }), _jsx("div", Object.assign({ className: "d-flex flex-column flex-fill justify-content-center align-items-center text-white" }, { children: _jsxs("div", Object.assign({ className: "quickscan-summary-panel d-flex flex-column flex-fill" }, { children: [_jsxs("div", Object.assign({ className: "p-3 d-flex flex-column tab-bg border-0 card" }, { children: [_jsx(ValidatedInput, { type: "text", className: "", disabled: true, value: address || propAddress }), addressError ? (_jsxs(Alert, Object.assign({ variant: "danger", className: "mt-3" }, { children: [_jsx("p", { children: _jsx("strong", { children: "Destination parsing error" }) }), addressError] }))) : "", lnurlLoading ? (_jsxs("div", Object.assign({ className: "d-flex flex-column align-items-center justify-content-center tab-accent mt-3" }, { children: [_jsx(Spinner, { animation: "border" }), "Loading data..."] }))) : "", addressError == null && props.swapper != null && !lnurlLoading ? (_jsxs("div", Object.assign({ className: "mt-3 tab-accent-p3 text-center" }, { children: [_jsx("label", Object.assign({ className: "fw-bold mb-1" }, { children: type === "send" ? "Pay" : "Withdraw" })), _jsx(ValidatedInput, { type: "number", textEnd: (_jsxs("span", Object.assign({ className: "text-white font-bigger d-flex align-items-center" }, { children: [_jsx("img", { src: btcCurrency.icon, className: "currency-icon" }), "BTC"] }))), step: new BigNumber(10).pow(new BigNumber(-btcCurrency.decimals)), min: amountConstraints == null ? new BigNumber(0) : amountConstraints.min, max: amountConstraints === null || amountConstraints === void 0 ? void 0 : amountConstraints.max, disabled: (amountConstraints != null && amountConstraints.min.eq(amountConstraints.max)) ||
                                                isLocked, size: "lg", inputRef: amountRef, value: amount, onChange: setAmount, placeholder: "Input amount" }), _jsx("label", Object.assign({ className: "fw-bold mb-1" }, { children: type === "send" ? "with" : "to" })), _jsx("div", Object.assign({ className: "d-flex justify-content-center" }, { children: _jsx(CurrencyDropdown, { currencyList: smartChainCurrencies, onSelect: val => {
                                                    if (isLocked)
                                                        return;
                                                    setSelectedCurrency(val);
                                                }, value: selectedCurrency, className: "bg-black bg-opacity-10 text-white" }) })), _jsxs(Form, Object.assign({ className: "text-start d-flex align-items-center justify-content-center font-bigger mt-2" }, { children: [_jsx(Form.Check // prettier-ignore
                                                , { id: "autoclaim-pay", type: "switch", onChange: (val) => setAndSaveAutoContinue(val.target.checked), checked: autoContinue }), _jsx("label", Object.assign({ title: "", htmlFor: "autoclaim-pay", className: "form-check-label me-2" }, { children: type === "send" ? "Auto-pay" : "Auto-claim" })), _jsx(OverlayTrigger, Object.assign({ overlay: _jsx(Tooltip, Object.assign({ id: "autoclaim-pay-tooltip" }, { children: "Automatically requests authorization of the transaction through your wallet - as soon as the swap pricing is returned." })) }, { children: _jsx(Badge, Object.assign({ bg: "primary", className: "pill-round", pill: true }, { children: "?" })) }))] }))] }))) : "", quoteLoading ? (_jsxs("div", Object.assign({ className: "d-flex flex-column align-items-center justify-content-center tab-accent mt-3" }, { children: [_jsx(Spinner, { animation: "border" }), "Fetching quote..."] }))) : "", quoteError ? (_jsxs(Alert, Object.assign({ variant: "danger", className: "mt-3" }, { children: [_jsx("p", { children: _jsx("strong", { children: "Quoting error" }) }), quoteError] }))) : "", quoteError || addressError ? (_jsx(Button, Object.assign({ variant: "secondary", onClick: goBack, className: "mt-3" }, { children: "Back" }))) : "", quote != null ? (_jsxs(_Fragment, { children: [_jsx(FeeSummaryScreen, { swap: quote[0], className: "mt-3 mb-3 tab-accent" }), _jsx(QuoteSummary, { swapper: props.swapper, setAmountLock: setLocked, type: "payment", quote: quote[0], balance: quote[1], refreshQuote: getQuote, autoContinue: autoContinue })] })) : ""] })), _jsx("div", Object.assign({ className: "d-flex mt-auto py-4" }, { children: _jsx(Button, Object.assign({ variant: "secondary flex-fill", disabled: isLocked, onClick: goBack }, { children: "< Back" })) }))] })) }))] }));
}

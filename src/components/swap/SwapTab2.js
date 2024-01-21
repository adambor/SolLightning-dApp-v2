import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { FromBTCSwap, IFromBTCSwap, IToBTCSwap, SolanaSwapper, SwapType, ToBTCSwap } from "sollightning-sdk";
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
import Icon from "react-icons-kit";
import { ic_arrow_downward } from 'react-icons-kit/md/ic_arrow_downward';
import * as bitcoin from "bitcoinjs-lib";
import { randomBytes } from "crypto-browserify";
import { FEConstants } from "../../FEConstants";
const defaultConstraints = {
    min: new BigNumber("0.000001"),
    max: null
};
const RANDOM_BTC_ADDRESS = bitcoin.payments.p2wsh({
    hash: randomBytes(32),
    network: FEConstants.chain === "DEVNET" ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
}).address;
const USDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});
export function SwapTab(props) {
    const [inCurrency, setInCurrency] = useState(btcCurrency);
    const [outCurrency, setOutCurrency] = useState(smartChainCurrencies[0]);
    const [amount, setAmount] = useState("");
    const inAmountRef = useRef();
    const outAmountRef = useRef();
    const [disabled, setDisabled] = useState(false);
    const [outConstraintsOverride, setOutConstraintsOverride] = useState();
    const [btcAmountConstraints, setBtcAmountConstraints] = useState();
    const [tokenConstraints, setTokenConstraints] = useState();
    const [exactIn, setExactIn] = useState(true);
    const [address, setAddress] = useState();
    const addressRef = useRef();
    const isLNURL = address == null ? false : props.swapper.isValidLNURL(address);
    const [quote, setQuote] = useState();
    const [quoteError, setQuoteError] = useState();
    const [quoteAddressError, setQuoteAddressError] = useState();
    const [quoteLoading, setQuoteLoading] = useState(false);
    const lnurlData = useRef();
    const [locked, setLocked] = useState(false);
    const { search } = useLocation();
    const params = new URLSearchParams(search);
    const propSwapId = params.get("swapId");
    const [doValidate, setDoValidate] = useState();
    const [inputValue, setInputValue] = useState();
    const [outputValue, setOutputValue] = useState();
    const inPricing = useRef({
        updates: 0,
        promise: Promise.resolve()
    });
    const outPricing = useRef({
        updates: 0,
        promise: Promise.resolve()
    });
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
    if (outConstraintsOverride != null) {
        outConstraints.min = BigNumber.max(outConstraints.min, outConstraintsOverride.min);
        outConstraints.max = BigNumber.min(outConstraints.max, outConstraintsOverride.max);
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
        var _a;
        quoteUpdates.current++;
        const updateNum = quoteUpdates.current;
        setQuote(null);
        setQuoteError(null);
        // setQuoteLoading(false);
        if (!isLNURL) {
            if (outConstraintsOverride != null) {
                setOutConstraintsOverride(null);
                setDoValidate(true);
            }
            setQuoteAddressError(null);
        }
        let useAddress = address;
        if ((outCurrency === null || outCurrency === void 0 ? void 0 : outCurrency.ticker) === "BTC") {
            if (!addressRef.current.validate()) {
                if (address === "") {
                    useAddress = RANDOM_BTC_ADDRESS;
                }
                else {
                    setQuoteLoading(false);
                    setOutConstraintsOverride(null);
                    setDoValidate(true);
                    return;
                }
            }
        }
        if ((outCurrency === null || outCurrency === void 0 ? void 0 : outCurrency.ticker) === "BTC-LN") {
            if (!addressRef.current.validate()) {
                setQuoteLoading(false);
                setOutConstraintsOverride(null);
                setDoValidate(true);
                return;
            }
        }
        let dataLNURL;
        if (isLNURL) {
            if (((_a = lnurlData.current) === null || _a === void 0 ? void 0 : _a.address) !== useAddress) {
                setQuoteAddressError(null);
                lnurlData.current = {
                    address: useAddress,
                    data: props.swapper.getLNURLTypeAndData(useAddress, false).catch(e => {
                        console.log(e);
                        return null;
                    })
                };
            }
            const lnurlResult = await lnurlData.current.data;
            if (lnurlResult == null) {
                setQuoteAddressError({
                    address: useAddress,
                    error: "Invalid LNURL / Lightning address"
                });
                return;
            }
            if (lnurlResult.type === "withdraw") {
                navigate("/scan/2?address=" + encodeURIComponent(useAddress), {
                    state: {
                        lnurlParams: Object.assign(Object.assign({}, lnurlResult), { min: lnurlResult.min.toString(10), max: lnurlResult.max.toString(10) })
                    }
                });
                return;
            }
            setOutConstraintsOverride({
                min: toHumanReadable(lnurlResult.min, outCurrency),
                max: toHumanReadable(lnurlResult.max, outCurrency)
            });
            setDoValidate(true);
            dataLNURL = lnurlResult;
        }
        if (exactIn) {
            outAmountRef.current.validate();
            if (!inAmountRef.current.validate()) {
                setQuoteLoading(false);
                return;
            }
        }
        else {
            inAmountRef.current.validate();
            if (!outAmountRef.current.validate()) {
                setQuoteLoading(false);
                return;
            }
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
                setOutConstraintsOverride(null);
                setDoValidate(true);
                tokenCurrency = outCurrency;
                quoteCurrency = exactIn ? inCurrency : outCurrency;
                promise = props.swapper.createFromBTCSwap(outCurrency.address, fromHumanReadableString(amount, quoteCurrency), !exactIn);
            }
            if ((inCurrency === null || inCurrency === void 0 ? void 0 : inCurrency.ticker) === "BTC-LN") {
                setOutConstraintsOverride(null);
                setDoValidate(true);
                tokenCurrency = outCurrency;
                quoteCurrency = exactIn ? inCurrency : outCurrency;
                promise = props.swapper.createFromBTCLNSwap(outCurrency.address, fromHumanReadableString(amount, quoteCurrency), !exactIn);
            }
            if ((outCurrency === null || outCurrency === void 0 ? void 0 : outCurrency.ticker) === "BTC") {
                setOutConstraintsOverride(null);
                setDoValidate(true);
                tokenCurrency = inCurrency;
                quoteCurrency = exactIn ? inCurrency : outCurrency;
                promise = props.swapper.createToBTCSwap(inCurrency.address, useAddress, fromHumanReadableString(amount, quoteCurrency), null, null, exactIn);
            }
            if ((outCurrency === null || outCurrency === void 0 ? void 0 : outCurrency.ticker) === "BTC-LN") {
                tokenCurrency = inCurrency;
                quoteCurrency = outCurrency;
                if (dataLNURL != null) {
                    quoteCurrency = exactIn ? inCurrency : outCurrency;
                    promise = props.swapper.createToBTCLNSwapViaLNURL(inCurrency.address, dataLNURL, fromHumanReadableString(amount, quoteCurrency), null, 5 * 24 * 60 * 60, null, null, exactIn);
                }
                else {
                    promise = props.swapper.createToBTCLNSwap(inCurrency.address, useAddress, 5 * 24 * 60 * 60);
                }
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
    //Input pricing
    useEffect(() => {
        if (inCurrency == null)
            return;
        inPricing.current.updates++;
        const updateNum = inPricing.current.updates;
        let _amount;
        if (exactIn) {
            if (amount === "") {
                setInputValue(null);
                return;
            }
            _amount = fromHumanReadableString(amount, inCurrency);
        }
        else {
            if (quote == null) {
                setInputValue(null);
                return;
            }
            _amount = quote.getInAmount();
        }
        if (_amount.isZero()) {
            setInputValue(null);
            return;
        }
        const process = () => {
            inPricing.current.promise = (async () => {
                if (inCurrency.ticker === "USDC") {
                    return _amount;
                }
                const usdcPrice = props.swapper.clientSwapContract.swapPrice.preFetchPrice(FEConstants.usdcToken);
                let btcAmount = _amount;
                if (inCurrency.ticker !== "BTC" && inCurrency.ticker !== "BTC-LN") {
                    btcAmount = await props.swapper.clientSwapContract.swapPrice.getToBtcSwapAmount(_amount, inCurrency.address);
                }
                return await props.swapper.clientSwapContract.swapPrice.getFromBtcSwapAmount(btcAmount, FEConstants.usdcToken, null, await usdcPrice);
            })().then(value => {
                if (inPricing.current.updates !== updateNum) {
                    return;
                }
                setInputValue(toHumanReadable(value, FEConstants.usdcToken));
            });
        };
        inPricing.current.promise.then(process, process);
    }, [amount, inCurrency, exactIn, quote]);
    //Output pricing
    useEffect(() => {
        if (outCurrency == null)
            return;
        outPricing.current.updates++;
        const updateNum = outPricing.current.updates;
        let _amount;
        if (!exactIn) {
            if (amount === "") {
                setOutputValue(null);
                return;
            }
            _amount = fromHumanReadableString(amount, outCurrency);
        }
        else {
            if (quote == null) {
                setOutputValue(null);
                return;
            }
            _amount = quote.getOutAmount();
        }
        if (_amount.isZero()) {
            setOutputValue(null);
            return;
        }
        const process = () => {
            outPricing.current.promise = (async () => {
                if (outCurrency.ticker === "USDC") {
                    return _amount;
                }
                const usdcPrice = props.swapper.clientSwapContract.swapPrice.preFetchPrice(FEConstants.usdcToken);
                let btcAmount = _amount;
                if (outCurrency.ticker !== "BTC" && outCurrency.ticker !== "BTC-LN") {
                    btcAmount = await props.swapper.clientSwapContract.swapPrice.getToBtcSwapAmount(_amount, outCurrency.address);
                }
                return await props.swapper.clientSwapContract.swapPrice.getFromBtcSwapAmount(btcAmount, FEConstants.usdcToken, null, await usdcPrice);
            })().then(value => {
                if (outPricing.current.updates !== updateNum) {
                    return;
                }
                setOutputValue(toHumanReadable(value, FEConstants.usdcToken));
            });
        };
        outPricing.current.promise.then(process, process);
    }, [amount, outCurrency, exactIn, quote]);
    return (_jsxs(_Fragment, { children: [_jsx(Topbar, { selected: 0, enabled: !locked }), _jsx("div", Object.assign({ className: "d-flex flex-column flex-fill align-items-center text-white" }, { children: _jsxs(Card, Object.assign({ className: "p-3 swap-panel tab-bg mx-3 mb-3 border-0" }, { children: [_jsxs(Alert, Object.assign({ className: "text-center", show: quoteError != null, variant: "danger", onClose: () => setQuoteError(null), dismissible: true, closeVariant: "white" }, { children: [_jsx("strong", { children: "Quoting error" }), _jsx("label", { children: quoteError })] })), _jsx(Card, Object.assign({ className: "d-flex flex-row tab-accent-p3" }, { children: _jsx(ValidatedInput, { disabled: locked || disabled, inputRef: inAmountRef, className: "flex-fill", type: "number", value: !exactIn ? (quote == null ? "" : toHumanReadableString(quote.getInAmount(), inCurrency)) : amount, size: "lg", textStart: !exactIn && quoteLoading ? (_jsx(Spinner, { size: "sm", className: "text-white" })) : null, onChange: val => {
                                    setAmount(val);
                                    setExactIn(true);
                                }, inputId: "amount-input", floatingLabel: inputValue == null ? null : USDollar.format(inputValue.toNumber()), expectingFloatingLabel: true, step: inCurrency == null ? new BigNumber("0.00000001") : new BigNumber(10).pow(new BigNumber(-inCurrency.decimals)), min: inConstraints.min, max: inConstraints.max, onValidate: (val) => {
                                    return exactIn && val === "" ? "Amount cannot be empty" : null;
                                }, elementEnd: (_jsx(CurrencyDropdown, { currencyList: kind === "frombtc" ? bitcoinCurrencies : props.supportedCurrencies, onSelect: val => {
                                        if (locked)
                                            return;
                                        setInCurrency(val);
                                    }, value: inCurrency, className: "round-right bg-transparent text-white" })) }) })), _jsx("div", Object.assign({ className: "d-flex justify-content-center swap-direction-wrapper" }, { children: _jsx(Button, Object.assign({ onClick: changeDirection, size: "lg", className: "px-0 swap-direction-btn" }, { children: _jsx(Icon, { size: 24, icon: ic_arrow_downward, style: { marginTop: "-3px", marginBottom: "2px" } }) })) })), _jsxs(Card, Object.assign({ className: "tab-accent-p3" }, { children: [_jsx("div", Object.assign({ className: "d-flex flex-row" }, { children: _jsx(ValidatedInput, { disabled: locked || disabled, inputRef: outAmountRef, className: "flex-fill strip-group-text", type: "number", value: exactIn ? (quote == null ? "" : toHumanReadableString(quote.getOutAmount(), outCurrency)) : amount, size: "lg", textStart: exactIn && quoteLoading ? (_jsx(Spinner, { size: "sm", className: "text-white" })) : null, onChange: val => {
                                            setAmount(val);
                                            setExactIn(false);
                                        }, inputId: "amount-output", floatingLabel: outputValue == null ? null : USDollar.format(outputValue.toNumber()), expectingFloatingLabel: true, step: outCurrency == null ? new BigNumber("0.00000001") : new BigNumber(10).pow(new BigNumber(-outCurrency.decimals)), min: outConstraints.min, max: outConstraints.max, onValidate: (val) => {
                                            return !exactIn && val === "" ? "Amount cannot be empty" : null;
                                        }, elementEnd: (_jsx(CurrencyDropdown, { currencyList: kind === "tobtc" ? bitcoinCurrencies : props.supportedCurrencies, onSelect: (val) => {
                                                if (locked)
                                                    return;
                                                setOutCurrency(val);
                                                if (kind === "tobtc" && val !== outCurrency) {
                                                    setDisabled(false);
                                                    setAddress("");
                                                }
                                            }, value: outCurrency, className: "round-right bg-transparent text-white" })) }) })), kind === "tobtc" ? (_jsxs(_Fragment, { children: [_jsx(ValidatedInput, { type: "text", className: "flex-fill mt-3", value: address, onChange: (val) => {
                                                setAddress(val);
                                                if (props.swapper.isValidLNURL(val)) {
                                                    // props.swapper.getLNURLTypeAndData(val, false).then((result) => {
                                                    //     navigate("/scan/2?address="+encodeURIComponent(val), {
                                                    //         state: {
                                                    //             lnurlParams: {
                                                    //                 ...result,
                                                    //                 min: result.min.toString(10),
                                                    //                 max: result.max.toString(10)
                                                    //             }
                                                    //         }
                                                    //     });
                                                    // }).catch(e => {});
                                                    setOutCurrency(bitcoinCurrencies[1]);
                                                    setDisabled(false);
                                                }
                                                if (props.swapper.isValidBitcoinAddress(val)) {
                                                    setOutCurrency(bitcoinCurrencies[0]);
                                                    setDisabled(false);
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
                                                if (val === "")
                                                    return "Destination address/lightning invoice required";
                                                console.log("Is valid bitcoin address: ", val);
                                                if (props.swapper.isValidLNURL(val) || props.swapper.isValidBitcoinAddress(val) || props.swapper.isValidLightningInvoice(val))
                                                    return null;
                                                try {
                                                    if (SolanaSwapper.getLightningInvoiceValue(val) == null) {
                                                        return "Lightning invoice needs to contain a payment amount!";
                                                    }
                                                }
                                                catch (e) { }
                                                return "Invalid bitcoin address/lightning network invoice";
                                            }, validated: quoteAddressError === null || quoteAddressError === void 0 ? void 0 : quoteAddressError.error }), outCurrency === bitcoinCurrencies[1] && !props.swapper.isValidLightningInvoice(address) && !props.swapper.isValidLNURL(address) ? (_jsx(Alert, Object.assign({ variant: "success", className: "mt-3 mb-0 text-center" }, { children: _jsx("label", { children: "We only support lightning network invoices with pre-set amount!" }) }))) : ""] })) : ""] })), quote != null ? (_jsxs(_Fragment, { children: [_jsx("div", Object.assign({ className: "mt-3" }, { children: _jsx(SimpleFeeSummaryScreen, { swap: quote }) })), quote.getAddress() !== RANDOM_BTC_ADDRESS ? (_jsx("div", Object.assign({ className: "mt-3 d-flex flex-column text-white" }, { children: _jsx(QuoteSummary, { type: "swap", swapper: props.swapper, quote: quote, refreshQuote: getQuote, setAmountLock: setLocked, abortSwap: () => {
                                            setLocked(false);
                                            setQuote(null);
                                            setAmount("");
                                        } }) }))) : ""] })) : ""] })) }))] }));
}

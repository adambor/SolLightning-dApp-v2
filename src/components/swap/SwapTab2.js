import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { FromBTCSwap, IFromBTCSwap, IToBTCSwap, SolanaSwapper, SwapType, ToBTCSwap } from "sollightning-sdk";
import { Alert, Button, Card, OverlayTrigger, Spinner, Tooltip } from "react-bootstrap";
import { useContext, useEffect, useRef, useState } from "react";
import ValidatedInput from "../ValidatedInput";
import BigNumber from "bignumber.js";
import { bitcoinCurrencies, btcCurrency, fromHumanReadableString, getCurrencySpec, smartChainCurrencies, toHumanReadable, toHumanReadableString } from "../../utils/Currencies";
import { CurrencyDropdown } from "../CurrencyDropdown";
import { SimpleFeeSummaryScreen } from "../SimpleFeeScreen";
import { QuoteSummary } from "../quotes/QuoteSummary";
import { Topbar } from "../Topbar";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "react-icons-kit";
import { arrows_vertical } from 'react-icons-kit/ikons/arrows_vertical';
import * as bitcoin from "bitcoinjs-lib";
import { randomBytes } from "crypto-browserify";
import { FEConstants } from "../../FEConstants";
import { ic_qr_code_scanner } from 'react-icons-kit/md/ic_qr_code_scanner';
import { lock } from 'react-icons-kit/fa/lock';
import { QRScannerModal } from "../qr/QRScannerModal";
import { BitcoinWalletContext } from "../context/BitcoinWalletContext";
const defaultConstraints = {
    min: new BigNumber("0.000001"),
    max: null
};
const RANDOM_BTC_ADDRESS = bitcoin.payments.p2wsh({
    hash: randomBytes(32),
    network: FEConstants.chain === "DEVNET" ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
}).address;
export function SwapTab(props) {
    const { bitcoinWallet } = useContext(BitcoinWalletContext);
    const [qrScanning, setQrScanning] = useState(false);
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
    const [address, _setAddress] = useState();
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
    const setAddress = (val) => {
        _setAddress(val);
        if (props.swapper.isValidLNURL(val)) {
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
    };
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
                    _setAddress(foundSwap.getAddress());
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
    useEffect(() => {
        if (bitcoinWallet == null)
            return;
        if (outCurrency.ticker === "BTC") {
            _setAddress(bitcoinWallet.getReceiveAddress());
        }
    }, [bitcoinWallet, outCurrency]);
    const changeDirection = () => {
        if (locked)
            return;
        setExactIn(!exactIn);
        setInCurrency(outCurrency);
        setOutCurrency(inCurrency);
        setDisabled(false);
        _setAddress("");
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
            let additionalParam;
            const affiliate = window.localStorage.getItem("atomiq-affiliate");
            if (affiliate != null) {
                additionalParam = {
                    affiliate
                };
            }
            let promise;
            let tokenCurrency;
            let quoteCurrency;
            if ((inCurrency === null || inCurrency === void 0 ? void 0 : inCurrency.ticker) === "BTC") {
                setOutConstraintsOverride(null);
                setDoValidate(true);
                tokenCurrency = outCurrency;
                quoteCurrency = exactIn ? inCurrency : outCurrency;
                promise = props.swapper.createFromBTCSwap(outCurrency.address, fromHumanReadableString(amount, quoteCurrency), !exactIn, additionalParam);
            }
            if ((inCurrency === null || inCurrency === void 0 ? void 0 : inCurrency.ticker) === "BTC-LN") {
                setOutConstraintsOverride(null);
                setDoValidate(true);
                tokenCurrency = outCurrency;
                quoteCurrency = exactIn ? inCurrency : outCurrency;
                promise = props.swapper.createFromBTCLNSwap(outCurrency.address, fromHumanReadableString(amount, quoteCurrency), !exactIn, null, additionalParam);
            }
            if ((outCurrency === null || outCurrency === void 0 ? void 0 : outCurrency.ticker) === "BTC") {
                setOutConstraintsOverride(null);
                setDoValidate(true);
                tokenCurrency = inCurrency;
                quoteCurrency = exactIn ? inCurrency : outCurrency;
                promise = props.swapper.createToBTCSwap(inCurrency.address, useAddress, fromHumanReadableString(amount, quoteCurrency), null, null, exactIn, additionalParam);
            }
            if ((outCurrency === null || outCurrency === void 0 ? void 0 : outCurrency.ticker) === "BTC-LN") {
                tokenCurrency = inCurrency;
                quoteCurrency = outCurrency;
                if (dataLNURL != null) {
                    quoteCurrency = exactIn ? inCurrency : outCurrency;
                    promise = props.swapper.createToBTCLNSwapViaLNURL(inCurrency.address, dataLNURL, fromHumanReadableString(amount, quoteCurrency), null, 5 * 24 * 60 * 60, null, null, exactIn, additionalParam);
                }
                else {
                    promise = props.swapper.createToBTCLNSwap(inCurrency.address, useAddress, 5 * 24 * 60 * 60, null, null, additionalParam);
                }
            }
            currentQuotation.current = promise.then((swap) => {
                if (quoteUpdates.current !== updateNum) {
                    return;
                }
                setQuoteLoading(false);
                setQuote(swap);
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
        setInputValue(null);
        let _amount;
        if (exactIn) {
            if (amount === "") {
                return;
            }
            _amount = fromHumanReadableString(amount, inCurrency);
        }
        else {
            if (quote == null) {
                return;
            }
            _amount = quote.getInAmount();
        }
        if (_amount.isZero()) {
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
        setOutputValue(null);
        let _amount;
        if (!exactIn) {
            if (amount === "") {
                return;
            }
            _amount = fromHumanReadableString(amount, outCurrency);
        }
        else {
            if (quote == null) {
                return;
            }
            _amount = quote.getOutAmount();
        }
        if (_amount.isZero()) {
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
    return (_jsxs(_Fragment, { children: [_jsx(Topbar, { selected: 0, enabled: !locked }), _jsx(QRScannerModal, { onScanned: (data) => {
                    console.log("QR scanned: ", data);
                    let resultText = data;
                    let _amount = null;
                    if (resultText.startsWith("lightning:")) {
                        resultText = resultText.substring(10);
                    }
                    else if (resultText.startsWith("bitcoin:")) {
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
                    setAddress(resultText);
                    if (_amount != null) {
                        setAmount(_amount);
                        setExactIn(false);
                    }
                    setQrScanning(false);
                }, show: qrScanning, onHide: () => setQrScanning(false) }), _jsx("div", Object.assign({ className: "d-flex flex-column align-items-center text-white" }, { children: _jsxs(Card, Object.assign({ className: "p-3 swap-panel tab-bg mx-3 mb-3 border-0" }, { children: [_jsxs(Alert, Object.assign({ className: "text-center", show: quoteError != null, variant: "danger", onClose: () => setQuoteError(null), dismissible: true, closeVariant: "white" }, { children: [_jsx("strong", { children: "Quoting error" }), _jsx("label", { children: quoteError })] })), _jsxs(Card, Object.assign({ className: "d-flex flex-column tab-accent-p3 pt-2" }, { children: [_jsx("div", Object.assign({ className: "d-flex flex-row" }, { children: _jsx("small", Object.assign({ className: "text-light text-opacity-75 me-auto" }, { children: "You pay" })) })), _jsx(ValidatedInput, { disabled: locked || disabled, inputRef: inAmountRef, className: "flex-fill", type: "number", value: !exactIn ? (quote == null ? "" : toHumanReadableString(quote.getInAmount(), inCurrency)) : amount, size: "lg", textStart: !exactIn && quoteLoading ? (_jsx(Spinner, { size: "sm", className: "text-white" })) : null, onChange: val => {
                                        setAmount(val);
                                        setExactIn(true);
                                    }, inputId: "amount-input", inputClassName: "font-weight-500", floatingLabel: inputValue == null ? null : FEConstants.USDollar.format(inputValue.toNumber()), expectingFloatingLabel: true, step: inCurrency == null ? new BigNumber("0.00000001") : new BigNumber(10).pow(new BigNumber(-inCurrency.decimals)), min: inConstraints.min, max: inConstraints.max, onValidate: (val) => {
                                        return exactIn && val === "" ? "Amount cannot be empty" : null;
                                    }, elementEnd: (_jsx(CurrencyDropdown, { currencyList: kind === "frombtc" ? bitcoinCurrencies : props.supportedCurrencies, onSelect: val => {
                                            if (locked)
                                                return;
                                            setInCurrency(val);
                                        }, value: inCurrency, className: "round-right text-white bg-black bg-opacity-10" })) })] })), _jsx("div", Object.assign({ className: "d-flex justify-content-center swap-direction-wrapper" }, { children: _jsx(Button, Object.assign({ onClick: changeDirection, size: "lg", className: "px-0 swap-direction-btn" }, { children: _jsx(Icon, { size: 22, icon: arrows_vertical, style: { marginTop: "-8px" } }) })) })), _jsxs(Card, Object.assign({ className: "tab-accent-p3 pt-2" }, { children: [_jsx("small", Object.assign({ className: "text-light text-opacity-75" }, { children: "You receive" })), _jsx("div", Object.assign({ className: "d-flex flex-row" }, { children: _jsx(ValidatedInput, { disabled: locked || disabled, inputRef: outAmountRef, className: "flex-fill strip-group-text", type: "number", value: exactIn ? (quote == null ? "" : toHumanReadableString(quote.getOutAmount(), outCurrency)) : amount, size: "lg", textStart: exactIn && quoteLoading ? (_jsx(Spinner, { size: "sm", className: "text-white" })) : null, onChange: val => {
                                            setAmount(val);
                                            setExactIn(false);
                                        }, inputId: "amount-output", inputClassName: "font-weight-500", floatingLabel: outputValue == null ? null : FEConstants.USDollar.format(outputValue.toNumber()), expectingFloatingLabel: true, step: outCurrency == null ? new BigNumber("0.00000001") : new BigNumber(10).pow(new BigNumber(-outCurrency.decimals)), min: outConstraints.min, max: outConstraints.max, onValidate: (val) => {
                                            return !exactIn && val === "" ? "Amount cannot be empty" : null;
                                        }, elementEnd: (_jsx(CurrencyDropdown, { currencyList: kind === "tobtc" ? bitcoinCurrencies : props.supportedCurrencies, onSelect: (val) => {
                                                if (locked)
                                                    return;
                                                setOutCurrency(val);
                                                if (kind === "tobtc" && val !== outCurrency) {
                                                    setDisabled(false);
                                                    _setAddress("");
                                                }
                                            }, value: outCurrency, className: "round-right text-white bg-black bg-opacity-10" })) }) })), kind === "tobtc" ? (_jsxs(_Fragment, { children: [_jsx(ValidatedInput, { type: "text", className: "flex-fill mt-3", value: address, onChange: (val) => {
                                                setAddress(val);
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
                                            }, validated: quoteAddressError === null || quoteAddressError === void 0 ? void 0 : quoteAddressError.error, textEnd: (_jsx(OverlayTrigger, Object.assign({ placement: "top", overlay: _jsx(Tooltip, Object.assign({ id: "scan-qr-tooltip" }, { children: "Scan QR code" })) }, { children: _jsx("a", Object.assign({ href: "#", style: {
                                                        marginTop: "-3px"
                                                    }, onClick: (e) => {
                                                        e.preventDefault();
                                                        setQrScanning(true);
                                                    } }, { children: _jsx(Icon, { size: 24, icon: ic_qr_code_scanner }) })) }))) }), outCurrency === bitcoinCurrencies[1] && !props.swapper.isValidLightningInvoice(address) && !props.swapper.isValidLNURL(address) ? (_jsx(Alert, Object.assign({ variant: "success", className: "mt-3 mb-0 text-center" }, { children: _jsx("label", { children: "Only lightning invoices with pre-set amount are supported! Use lightning address/LNURL for variable amount." }) }))) : ""] })) : ""] })), quote != null ? (_jsxs(_Fragment, { children: [_jsx("div", Object.assign({ className: "mt-3" }, { children: _jsx(SimpleFeeSummaryScreen, { swap: quote }) })), quote.getAddress() !== RANDOM_BTC_ADDRESS ? (_jsx("div", Object.assign({ className: "mt-3 d-flex flex-column text-white" }, { children: _jsx(QuoteSummary, { type: "swap", swapper: props.swapper, quote: quote, refreshQuote: getQuote, setAmountLock: setLocked, abortSwap: () => {
                                            setLocked(false);
                                            setQuote(null);
                                            setAmount("");
                                        } }) }))) : ""] })) : ""] })) })), _jsx("div", Object.assign({ className: "text-light text-opacity-50 d-flex flex-row align-items-center justify-content-center mb-3" }, { children: _jsxs("div", Object.assign({ className: "cursor-pointer d-flex align-items-center justify-content-center", onClick: () => navigate("/faq?tabOpen=6") }, { children: [_jsx(Icon, { size: 18, icon: lock, style: { marginTop: "-0.5rem" } }), _jsx("small", { children: "Audited by" }), _jsx("img", { className: "opacity-50 d-block ms-1", height: 18, src: "/ackee_blockchain.svg", style: { marginTop: "-0.125rem" } })] })) }))] }));
}

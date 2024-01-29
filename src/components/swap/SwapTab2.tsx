import {
    BinanceSwapPrice,
    FromBTCSwap,
    IFromBTCSwap,
    ISwap,
    IToBTCSwap,
    LNURLPay,
    LNURLWithdraw,
    SolanaSwapper,
    SwapType,
    ToBTCSwap
} from "sollightning-sdk";
import {Accordion, Alert, Badge, Button, Card, OverlayTrigger, Spinner, Tooltip} from "react-bootstrap";
import {useEffect, useRef, useState} from "react";
import ValidatedInput, {ValidatedInputRef} from "../ValidatedInput";
import BigNumber from "bignumber.js";
import * as React from "react";
import {
    bitcoinCurrencies,
    btcCurrency,
    CurrencySpec,
    fromHumanReadableString, getCurrencySpec, smartChainCurrencies,
    toHumanReadable, toHumanReadableString
} from "../../utils/Currencies";
import {CurrencyDropdown} from "../CurrencyDropdown";
import {FeePart, SimpleFeeSummaryScreen} from "../SimpleFeeScreen";
import {QuoteSummary} from "../quotes/QuoteSummary";
import {Topbar} from "../Topbar";
import {useLocation, useNavigate} from "react-router-dom";
import Icon from "react-icons-kit";
import {arrows_vertical} from 'react-icons-kit/ikons/arrows_vertical';
import {ic_account_balance_wallet_outline} from 'react-icons-kit/md/ic_account_balance_wallet_outline';
import * as bitcoin from "bitcoinjs-lib";
import {randomBytes} from "crypto-browserify";
import {FEConstants} from "../../FEConstants";
import * as BN from "bn.js";
import {ic_qr_code_scanner} from 'react-icons-kit/md/ic_qr_code_scanner';
import {QRScannerModal} from "../qr/QRScannerModal";

const defaultConstraints = {
    min: new BigNumber("0.000001"),
    max: null
};

const RANDOM_BTC_ADDRESS = bitcoin.payments.p2wsh({
    hash: randomBytes(32),
    network: FEConstants.chain==="DEVNET" ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
}).address;

const USDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

export function SwapTab(props: {
    swapper: SolanaSwapper,
    supportedCurrencies: CurrencySpec[]
}) {

    const [qrScanning, setQrScanning] = useState<boolean>(false);
    const [inCurrency, setInCurrency] = useState<CurrencySpec>(btcCurrency);
    const [outCurrency, setOutCurrency] = useState<CurrencySpec>(smartChainCurrencies[0]);
    const [amount, setAmount] = useState<string>("");
    const inAmountRef = useRef<ValidatedInputRef>();
    const outAmountRef = useRef<ValidatedInputRef>();
    const [disabled, setDisabled] = useState<boolean>(false);

    const [outConstraintsOverride, setOutConstraintsOverride] = useState<{
        min: BigNumber,
        max: BigNumber
    }>();

    const [btcAmountConstraints, setBtcAmountConstraints] = useState<
        {
            [key: number]: {
                min: BigNumber,
                max: BigNumber
            }
        }
    >();

    const [tokenConstraints, setTokenConstraints] = useState<{
        [token: string] : {
            [key: number]: {
                min: BigNumber,
                max: BigNumber
            }
        }
    }>();

    const [exactIn, setExactIn] = useState<boolean>(true);

    const [address, _setAddress] = useState<string>();
    const addressRef = useRef<ValidatedInputRef>();

    const isLNURL = address==null ? false : props.swapper.isValidLNURL(address);

    const [quote, setQuote] = useState<ISwap>();
    const [quoteError, setQuoteError] = useState<string>();
    const [quoteAddressError, setQuoteAddressError] = useState<{address: string, error: string}>();
    const [quoteLoading, setQuoteLoading] = useState<boolean>(false);

    const lnurlData = useRef<{
        data: Promise<LNURLPay | LNURLWithdraw>,
        address: string
    }>();

    const [locked, setLocked] = useState<boolean>(false);

    const {search} = useLocation();
    const params = new URLSearchParams(search);
    const propSwapId = params.get("swapId");

    const [doValidate, setDoValidate] = useState<boolean>();

    const [inputValue, setInputValue] = useState<BigNumber>();
    const [outputValue, setOutputValue] = useState<BigNumber>();

    const inPricing = useRef<{
        updates: number,
        promise: Promise<any>
    }>({
        updates: 0,
        promise: Promise.resolve()
    });
    const outPricing = useRef<{
        updates: number,
        promise: Promise<any>
    }>({
        updates: 0,
        promise: Promise.resolve()
    });

    const navigate = useNavigate();

    let swapType: SwapType;
    if(outCurrency?.ticker==="BTC") swapType = SwapType.TO_BTC;
    if(outCurrency?.ticker==="BTC-LN") swapType = SwapType.TO_BTCLN;
    if(inCurrency?.ticker==="BTC") swapType = SwapType.FROM_BTC;
    if(inCurrency?.ticker==="BTC-LN") swapType = SwapType.FROM_BTCLN;

    let kind: "frombtc" | "tobtc";
    if(swapType===SwapType.TO_BTC || swapType===SwapType.TO_BTCLN) {
        kind = "tobtc";
    } else {
        kind = "frombtc";
    }

    let inConstraints: {min: BigNumber, max:BigNumber};
    let outConstraints: {min: BigNumber, max:BigNumber};
    if(exactIn) {
        outConstraints = defaultConstraints;
        if(kind==="frombtc") {
            inConstraints = btcAmountConstraints==null ? defaultConstraints : (btcAmountConstraints[swapType] || defaultConstraints);
        } else {
            const constraint = tokenConstraints==null ? null : tokenConstraints[inCurrency.address.toString()];
            if(constraint!=null) {
                inConstraints = constraint[swapType] || defaultConstraints;
            } else {
                inConstraints = defaultConstraints;
            }
        }
    } else { //exact out
        inConstraints = defaultConstraints;
        if(kind==="frombtc") {
            const constraint = tokenConstraints==null ? null : tokenConstraints[outCurrency.address.toString()];
            if(constraint!=null) {
                outConstraints = constraint[swapType] || defaultConstraints;
            } else {
                outConstraints = defaultConstraints;
            }
        } else { //tobtc
            outConstraints = btcAmountConstraints==null ? defaultConstraints : (btcAmountConstraints[swapType] || defaultConstraints);
        }
    }

    if(outConstraintsOverride!=null) {
        outConstraints.min = BigNumber.max(outConstraints.min, outConstraintsOverride.min);
        outConstraints.max = BigNumber.min(outConstraints.max, outConstraintsOverride.max);
    }

    const setAddress = (val: string) => {
        _setAddress(val);
        if(props.swapper.isValidLNURL(val)) {
            setOutCurrency(bitcoinCurrencies[1]);
            setDisabled(false);
        }
        if(props.swapper.isValidBitcoinAddress(val)) {
            setOutCurrency(bitcoinCurrencies[0]);
            setDisabled(false);
        }
        if(props.swapper.isValidLightningInvoice(val)) {
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
        if(!doValidate) return;
        outAmountRef.current.validate();
        inAmountRef.current.validate();
        setDoValidate(false);
    }, [doValidate]);

    useEffect(() => {
        if(props.swapper==null || propSwapId==null) return;
        props.swapper.getAllSwaps().then(res => {
            const foundSwap = res.find(e => e.getPaymentHash().toString("hex")===propSwapId);
            if(foundSwap!=null) {
                setLocked(true);
                setQuote(foundSwap);
                if(foundSwap instanceof IToBTCSwap) {
                    const inCurr = getCurrencySpec(foundSwap.getToken());
                    const outCurr = foundSwap instanceof ToBTCSwap ? bitcoinCurrencies[0] : bitcoinCurrencies[1];
                    setInCurrency(inCurr);
                    setOutCurrency(outCurr);
                    setAmount(toHumanReadableString(foundSwap.getOutAmount(), outCurr));
                    _setAddress(foundSwap.getAddress());
                    setExactIn(false);
                } else if(foundSwap instanceof IFromBTCSwap) {
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
        if(props.swapper==null) {
            setBtcAmountConstraints(null);
            return;
        }

        const constraints: {
            [key in SwapType]?: {
                min: BigNumber,
                max: BigNumber
            }
        } = {};
        [SwapType.FROM_BTC, SwapType.TO_BTC, SwapType.FROM_BTCLN, SwapType.TO_BTCLN].forEach(swapType =>
            constraints[swapType] = {
                min: toHumanReadable(props.swapper.getMinimum(swapType), btcCurrency),
                max: toHumanReadable(props.swapper.getMaximum(swapType), btcCurrency),
            }
        );
        setBtcAmountConstraints(constraints);

        setDoValidate(true);
    }, [props.swapper]);

    const changeDirection = () => {
        if(locked) return;
        setExactIn(!exactIn);
        setInCurrency(outCurrency);
        setOutCurrency(inCurrency);
        setDisabled(false);
        _setAddress("");
    };

    const quoteUpdates = useRef<number>(0);
    const currentQuotation = useRef<Promise<any>>(Promise.resolve());

    const getQuote = async () => {
        quoteUpdates.current++;
        const updateNum = quoteUpdates.current;

        setQuote(null);
        setQuoteError(null);
        // setQuoteLoading(false);

        if(!isLNURL) {
            if(outConstraintsOverride!=null) {
                setOutConstraintsOverride(null);
                setDoValidate(true);
            }
            setQuoteAddressError(null);
        }

        let useAddress = address;
        if(outCurrency?.ticker==="BTC") {
            if(!addressRef.current.validate()) {
                if(address==="") {
                    useAddress = RANDOM_BTC_ADDRESS;
                } else {
                    setQuoteLoading(false);
                    setOutConstraintsOverride(null);
                    setDoValidate(true);
                    return;
                }
            }
        }
        if(outCurrency?.ticker==="BTC-LN") {
            if(!addressRef.current.validate()) {
                setQuoteLoading(false);
                setOutConstraintsOverride(null);
                setDoValidate(true);
                return;
            }
        }

        let dataLNURL: LNURLPay;

        if(isLNURL) {
            if(lnurlData.current?.address!==useAddress) {
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
            if(lnurlResult==null) {
                setQuoteAddressError({
                    address: useAddress,
                    error: "Invalid LNURL / Lightning address"
                });
                return;
            }

            if(lnurlResult.type==="withdraw") {
                navigate("/scan/2?address="+encodeURIComponent(useAddress), {
                    state: {
                        lnurlParams: {
                            ...lnurlResult,
                            min: lnurlResult.min.toString(10),
                            max: lnurlResult.max.toString(10)
                        }
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

        if(exactIn) {
            outAmountRef.current.validate();
            if(!inAmountRef.current.validate()) {
                setQuoteLoading(false);
                return;
            }
        } else {
            inAmountRef.current.validate();
            if(!outAmountRef.current.validate()) {
                setQuoteLoading(false);
                return;
            }
        }

        const process = () => {
            if(quoteUpdates.current!==updateNum) {
                return;
            }
            setQuoteLoading(true);
            let promise: Promise<ISwap>;
            let tokenCurrency: CurrencySpec;
            let quoteCurrency: CurrencySpec;
            if(inCurrency?.ticker==="BTC") {
                setOutConstraintsOverride(null);
                setDoValidate(true);
                tokenCurrency = outCurrency;
                quoteCurrency = exactIn ? inCurrency : outCurrency;
                promise = props.swapper.createFromBTCSwap(outCurrency.address, fromHumanReadableString(amount, quoteCurrency), !exactIn);
            }
            if(inCurrency?.ticker==="BTC-LN") {
                setOutConstraintsOverride(null);
                setDoValidate(true);
                tokenCurrency = outCurrency;
                quoteCurrency = exactIn ? inCurrency : outCurrency;
                promise = props.swapper.createFromBTCLNSwap(outCurrency.address, fromHumanReadableString(amount, quoteCurrency), !exactIn);
            }
            if(outCurrency?.ticker==="BTC") {
                setOutConstraintsOverride(null);
                setDoValidate(true);
                tokenCurrency = inCurrency;
                quoteCurrency = exactIn ? inCurrency : outCurrency;
                promise = props.swapper.createToBTCSwap(inCurrency.address, useAddress, fromHumanReadableString(amount, quoteCurrency), null, null, exactIn);
            }
            if(outCurrency?.ticker==="BTC-LN") {
                tokenCurrency = inCurrency;
                quoteCurrency = outCurrency;
                if(dataLNURL!=null) {
                    quoteCurrency = exactIn ? inCurrency : outCurrency;
                    promise = props.swapper.createToBTCLNSwapViaLNURL(inCurrency.address, dataLNURL, fromHumanReadableString(amount, quoteCurrency), null, 5*24*60*60, null, null, exactIn);
                } else {
                    promise = props.swapper.createToBTCLNSwap(inCurrency.address, useAddress, 5*24*60*60);
                }
            }
            currentQuotation.current = promise.then((swap) => {
                if(quoteUpdates.current!==updateNum) {
                    return;
                }
                setQuoteLoading(false);
                setQuote(swap);
                //TODO: Check if the user has enough lamports to cover solana transaction fees
            }).catch(e => {
                let doSetError = true;
                if(e.min!=null && e.max!=null) {
                    if(tokenCurrency===quoteCurrency) {
                        setTokenConstraints(val => {
                            if(val==null) val = {};
                            if(val[tokenCurrency.address.toString()]==null) val[tokenCurrency.address.toString()] = {};
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
                if(quoteUpdates.current!==updateNum) {
                    return;
                }
                setDoValidate(true);
                setQuoteLoading(false);
                if(doSetError) setQuoteError(e.toString());
            });
        };

        currentQuotation.current.then(process, process);

    };

    useEffect(() => {

        if(locked) return;

        setQuote(null);

        if(props.swapper==null) return;

        if(inCurrency==null) return;
        if(outCurrency==null) return;

        getQuote();

    }, [address, amount, inCurrency, outCurrency, exactIn, props.swapper]);

    //Input pricing
    useEffect(() => {
        if(inCurrency==null) return;

        inPricing.current.updates++;
        const updateNum = inPricing.current.updates;

        setInputValue(null);

        let _amount: BN;
        if(exactIn) {
            if(amount==="") {
                return;
            }
            _amount = fromHumanReadableString(amount, inCurrency);
        } else {
            if(quote==null) {
                return;
            }
            _amount = quote.getInAmount();
        }

        if(_amount.isZero()) {
            return;
        }

        const process = () => {
            inPricing.current.promise = (async () => {
                if(inCurrency.ticker==="USDC") {
                    return _amount;
                }
                const usdcPrice = props.swapper.clientSwapContract.swapPrice.preFetchPrice(FEConstants.usdcToken);
                let btcAmount = _amount;
                if(inCurrency.ticker!=="BTC" && inCurrency.ticker!=="BTC-LN") {
                    btcAmount = await props.swapper.clientSwapContract.swapPrice.getToBtcSwapAmount(_amount, inCurrency.address);
                }
                return await props.swapper.clientSwapContract.swapPrice.getFromBtcSwapAmount(btcAmount, FEConstants.usdcToken, null, await usdcPrice);
            })().then(value => {
                if(inPricing.current.updates!==updateNum) {
                    return;
                }
                setInputValue(toHumanReadable(value, FEConstants.usdcToken));
            });
        }

        inPricing.current.promise.then(process, process);
    }, [amount, inCurrency, exactIn, quote]);

    //Output pricing
    useEffect(() => {
        if(outCurrency==null) return;

        outPricing.current.updates++;
        const updateNum = outPricing.current.updates;

        setOutputValue(null);

        let _amount: BN;
        if(!exactIn) {
            if(amount==="") {
                return;
            }
            _amount = fromHumanReadableString(amount, outCurrency);
        } else {
            if(quote==null) {
                return;
            }
            _amount = quote.getOutAmount();
        }

        if(_amount.isZero()) {
            return;
        }

        const process = () => {
            outPricing.current.promise = (async () => {
                if(outCurrency.ticker==="USDC") {
                    return _amount;
                }
                const usdcPrice = props.swapper.clientSwapContract.swapPrice.preFetchPrice(FEConstants.usdcToken);
                let btcAmount = _amount;
                if(outCurrency.ticker!=="BTC" && outCurrency.ticker!=="BTC-LN") {
                    btcAmount = await props.swapper.clientSwapContract.swapPrice.getToBtcSwapAmount(_amount, outCurrency.address);
                }
                return await props.swapper.clientSwapContract.swapPrice.getFromBtcSwapAmount(btcAmount, FEConstants.usdcToken, null, await usdcPrice);
            })().then(value => {
                if(outPricing.current.updates!==updateNum) {
                    return;
                }
                setOutputValue(toHumanReadable(value, FEConstants.usdcToken));
            });
        }

        outPricing.current.promise.then(process, process);
    }, [amount, outCurrency, exactIn, quote]);

    return (
        <>
            <Topbar selected={0} enabled={!locked}/>

            <QRScannerModal onScanned={(data: string) => {
                console.log("QR scanned: ", data);

                let resultText: string = data;
                let _amount: string = null;
                if(resultText.startsWith("lightning:")) {
                    resultText = resultText.substring(10);
                } else if(resultText.startsWith("bitcoin:")) {
                    resultText = resultText.substring(8);
                    if(resultText.includes("?")) {
                        const arr = resultText.split("?");
                        resultText = arr[0];
                        const params = arr[1].split("&");
                        for(let param of params) {
                            const arr2 = param.split("=");
                            const key = arr2[0];
                            const value = decodeURIComponent(arr2[1]);
                            if(key==="amount") {
                                _amount = value;
                            }
                        }
                    }
                }

                setAddress(resultText);
                if(_amount!=null) {
                    setAmount(_amount);
                    setExactIn(false);
                }

                setQrScanning(false);

            }} show={qrScanning} onHide={() => setQrScanning(false)}/>

            <div className="d-flex flex-column flex-fill align-items-center text-white">
                <Card className="p-3 swap-panel tab-bg mx-3 mb-3 border-0">

                    <Alert className="text-center" show={quoteError!=null} variant="danger" onClose={() => setQuoteError(null)} dismissible closeVariant="white">
                        <strong>Quoting error</strong>
                        <label>{quoteError}</label>
                    </Alert>

                    <Card className="d-flex flex-column tab-accent-p3 pt-2">
                        <div className="d-flex flex-row">
                            <small className="text-light text-opacity-75 me-auto">You pay</small>

                            {/*<Icon size={16} icon={ic_account_balance_wallet_outline} style={{marginTop: "-0.3125rem"}} className=""/>*/}
                            {/*<small className="text-light text-opacity-75 ms-1 me-2">0.00018372 BTC</small>*/}

                            {/*<Badge pill className="bg-transparent border-light border border-opacity-75 pb-0">HALF</Badge>*/}
                            {/*<Badge pill className="bg-transparent border-light border border-opacity-75 pb-0">MAX</Badge>*/}
                        </div>
                        <ValidatedInput
                            disabled={locked || disabled}
                            inputRef={inAmountRef}
                            className="flex-fill"
                            type="number"
                            value={!exactIn ? (quote==null ? "" : toHumanReadableString(quote.getInAmount(), inCurrency)) : amount }
                            size={"lg"}
                            textStart={!exactIn && quoteLoading ? (
                                <Spinner size="sm" className="text-white"/>
                            ) : null}
                            onChange={val => {
                                setAmount(val);
                                setExactIn(true);
                            }}
                            inputId="amount-input"
                            inputClassName="font-weight-500"
                            floatingLabel={inputValue==null ? null : USDollar.format(inputValue.toNumber())}
                            expectingFloatingLabel={true}
                            step={inCurrency==null ? new BigNumber("0.00000001") : new BigNumber(10).pow(new BigNumber(-inCurrency.decimals))}
                            min={inConstraints.min}
                            max={inConstraints.max}
                            onValidate={(val: any) => {
                                return exactIn && val==="" ? "Amount cannot be empty" : null;
                            }}
                            elementEnd={(
                                <CurrencyDropdown currencyList={kind==="frombtc" ? bitcoinCurrencies : props.supportedCurrencies} onSelect={val => {
                                    if(locked) return;
                                    setInCurrency(val);
                                }} value={inCurrency} className="round-right text-white bg-black bg-opacity-10"/>
                            )}
                        />
                    </Card>
                    <div className="d-flex justify-content-center swap-direction-wrapper">
                        <Button onClick={changeDirection} size="lg" className="px-0 swap-direction-btn">
                            <Icon size={22} icon={arrows_vertical} style={{marginTop: "-8px"}}/>
                        </Button>
                    </div>
                    <Card className="tab-accent-p3 pt-2">
                        <small className="text-light text-opacity-75">You receive</small>
                        <div className="d-flex flex-row">
                            <ValidatedInput
                                disabled={locked || disabled}
                                inputRef={outAmountRef}
                                className="flex-fill strip-group-text"
                                type="number"
                                value={exactIn ? (quote==null ? "" : toHumanReadableString(quote.getOutAmount(), outCurrency)) : amount }
                                size={"lg"}
                                textStart={exactIn && quoteLoading ? (
                                    <Spinner size="sm" className="text-white"/>
                                ) : null}
                                onChange={val => {
                                    setAmount(val);
                                    setExactIn(false);
                                }}
                                inputId="amount-output"
                                inputClassName="font-weight-500"
                                floatingLabel={outputValue==null ? null : USDollar.format(outputValue.toNumber())}
                                expectingFloatingLabel={true}
                                step={outCurrency==null ? new BigNumber("0.00000001") : new BigNumber(10).pow(new BigNumber(-outCurrency.decimals))}
                                min={outConstraints.min}
                                max={outConstraints.max}
                                onValidate={(val: any) => {
                                    return !exactIn && val==="" ? "Amount cannot be empty" : null;
                                }}
                                elementEnd={(
                                    <CurrencyDropdown currencyList={kind==="tobtc" ? bitcoinCurrencies : props.supportedCurrencies} onSelect={(val) => {
                                        if(locked) return;
                                        setOutCurrency(val);
                                        if(kind==="tobtc" && val!==outCurrency) {
                                            setDisabled(false);
                                            _setAddress("");
                                        }
                                    }} value={outCurrency} className="round-right text-white bg-black bg-opacity-10"/>
                                )}
                            />
                        </div>
                        {kind==="tobtc" ? (
                            <>
                                <ValidatedInput
                                    type={"text"}
                                    className="flex-fill mt-3"
                                    value={address}
                                    onChange={(val) => {
                                        setAddress(val);
                                    }}
                                    inputRef={addressRef}
                                    placeholder={"Paste Bitcoin/Lightning address"}
                                    onValidate={(val) => {
                                        if(val==="") return "Destination address/lightning invoice required";
                                        console.log("Is valid bitcoin address: ", val);
                                        if(props.swapper.isValidLNURL(val) || props.swapper.isValidBitcoinAddress(val) || props.swapper.isValidLightningInvoice(val)) return null;
                                        try {
                                            if(SolanaSwapper.getLightningInvoiceValue(val)==null) {
                                                return "Lightning invoice needs to contain a payment amount!";
                                            }
                                        } catch (e) {}
                                        return "Invalid bitcoin address/lightning network invoice";
                                    }}
                                    validated={quoteAddressError?.error}
                                    textEnd={(
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={<Tooltip id="scan-qr-tooltip">Scan QR code</Tooltip>}
                                        >
                                            <a href="#" style={{
                                                marginTop: "-3px"
                                            }} onClick={(e) => {
                                                e.preventDefault();
                                                setQrScanning(true);
                                            }}><Icon size={24} icon={ic_qr_code_scanner}/></a>
                                        </OverlayTrigger>
                                    )}
                                />
                                {outCurrency===bitcoinCurrencies[1] && !props.swapper.isValidLightningInvoice(address) && !props.swapper.isValidLNURL(address) ? (
                                    <Alert variant={"success"} className="mt-3 mb-0 text-center">
                                        <label>Only lightning invoices with pre-set amount are supported! Use lightning address/LNURL for variable amount.</label>
                                    </Alert>
                                ) : ""}
                            </>
                        ) : ""}
                    </Card>

                    {/*<Accordion defaultActiveKey="0">*/}
                    {/*    <Accordion.Item eventKey="0">*/}
                    {/*        <Accordion.Header>*/}
                    {/*            <FeePart text="Total fee" bold currency1={bitcoinCurrencies[0]} amount1={new BN(12421)} currency2={smartChainCurrencies[0]} amount2={new BN(48128321)}/>*/}
                    {/*        </Accordion.Header>*/}
                    {/*        <Accordion.Body>*/}
                    {/*            <FeePart text="Swap fee" currency1={bitcoinCurrencies[0]} amount1={new BN(7512)} currency2={smartChainCurrencies[0]} amount2={new BN(35921232)}/>*/}
                    {/*            <FeePart text="Network fee" currency1={bitcoinCurrencies[0]} amount1={new BN(4281)} currency2={smartChainCurrencies[0]} amount2={new BN(17120123)}/>*/}
                    {/*        </Accordion.Body>*/}
                    {/*    </Accordion.Item>*/}
                    {/*</Accordion>*/}

                    {quote!=null ? (
                        <>
                            <div className="mt-3">
                                <SimpleFeeSummaryScreen swap={quote}/>
                            </div>
                            {quote.getAddress()!==RANDOM_BTC_ADDRESS ? (
                                <div className="mt-3 d-flex flex-column text-white">
                                    <QuoteSummary type="swap" swapper={props.swapper} quote={quote} refreshQuote={getQuote} setAmountLock={setLocked} abortSwap={() => {
                                        setLocked(false);
                                        setQuote(null);
                                        setAmount("");
                                    }}/>
                                </div>
                            ) : ""}
                        </>
                    ) : ""}
                </Card>
            </div>
        </>
    )

}
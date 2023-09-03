import {FromBTCSwap, IFromBTCSwap, ISwap, IToBTCSwap, SolanaSwapper, SwapType, ToBTCSwap} from "sollightning-sdk";
import {Button, Card, Spinner} from "react-bootstrap";
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
import {SimpleFeeSummaryScreen} from "../SimpleFeeScreen";
import {QuoteSummary} from "../QuoteSummary";
import {Topbar} from "../Topbar";
import {useLocation, useNavigate} from "react-router-dom";


export function SwapTab(props: {
    swapper: SolanaSwapper,
    supportedCurrencies: CurrencySpec[]
}) {

    const [inCurrency, setInCurrency] = useState<CurrencySpec>(btcCurrency);
    const [outCurrency, setOutCurrency] = useState<CurrencySpec>(smartChainCurrencies[0]);
    const [amount, setAmount] = useState<string>("");
    const inAmountRef = useRef<ValidatedInputRef>();
    const outAmountRef = useRef<ValidatedInputRef>();
    const [disabled, setDisabled] = useState<boolean>(false);
    const [btcAmountConstraints, setBtcAmountConstraints] = useState<{
        min: BigNumber,
        max: BigNumber
    }>({
        min: new BigNumber("0.00001"),
        max: null
    });

    const [kind, setKind] = useState<"frombtc" | "tobtc">("frombtc");
    const [exactIn, setExactIn] = useState<boolean>(true);

    const [address, setAddress] = useState<string>();
    const addressRef = useRef<ValidatedInputRef>();

    const [quote, setQuote] = useState<ISwap>();
    const [quoteError, setQuoteError] = useState<string>();
    const [quoteLoading, setQuoteLoading] = useState<boolean>(false);

    const [locked, setLocked] = useState<boolean>(false);

    const {search} = useLocation();
    const params = new URLSearchParams(search);
    const propSwapId = params.get("swapId");

    const [doValidate, setDoValidate] = useState<boolean>();

    const navigate = useNavigate();

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
                    setAddress(foundSwap.getAddress());
                    setKind("tobtc");
                    setExactIn(false);
                } else if(foundSwap instanceof IFromBTCSwap) {
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
        if(props.swapper==null) {
            setBtcAmountConstraints({
                min: new BigNumber("0.00001"),
                max: null
            });
            return;
        }
        if(inCurrency?.ticker==="BTC") {
            setBtcAmountConstraints({
                min: toHumanReadable(props.swapper.getMinimum(SwapType.FROM_BTC), inCurrency),
                max: toHumanReadable(props.swapper.getMaximum(SwapType.FROM_BTC), inCurrency),
            });
        }
        if(inCurrency?.ticker==="BTC-LN") {
            setBtcAmountConstraints({
                min: toHumanReadable(props.swapper.getMinimum(SwapType.FROM_BTCLN), inCurrency),
                max: toHumanReadable(props.swapper.getMaximum(SwapType.FROM_BTCLN), inCurrency),
            });
        }
        if(outCurrency?.ticker==="BTC") {
            setBtcAmountConstraints({
                min: toHumanReadable(props.swapper.getMinimum(SwapType.TO_BTC), outCurrency),
                max: toHumanReadable(props.swapper.getMaximum(SwapType.TO_BTC), outCurrency),
            });
        }
        if(outCurrency?.ticker==="BTC-LN") {
            setBtcAmountConstraints({
                min: toHumanReadable(props.swapper.getMinimum(SwapType.TO_BTCLN), outCurrency),
                max: toHumanReadable(props.swapper.getMaximum(SwapType.TO_BTCLN), outCurrency),
            });
        }
        setDoValidate(true);
    }, [inCurrency, outCurrency, props.swapper]);

    const changeDirection = () => {
        if(locked) return;
        if(kind==="frombtc") {
            setKind("tobtc");
            setExactIn(false);
        } else {
            setKind("frombtc");
            setExactIn(true);
        }
        setInCurrency(outCurrency);
        setOutCurrency(inCurrency);
        setDisabled(false);
        setAddress("");
    };

    const quoteUpdates = useRef<number>(0);
    const currentQuotation = useRef<Promise<any>>(Promise.resolve());

    const getQuote = async () => {
        quoteUpdates.current++;
        const updateNum = quoteUpdates.current;

        setQuote(null);
        setQuoteError(null);
        setQuoteLoading(false);

        if(inCurrency?.ticker==="BTC") {
            if(!inAmountRef.current.validate()) return;
        }
        if(inCurrency?.ticker==="BTC-LN") {
            if(!inAmountRef.current.validate()) return;
        }
        if(outCurrency?.ticker==="BTC") {
            if(!outAmountRef.current.validate()) return;
            if(!addressRef.current.validate()) return;
        }
        if(outCurrency?.ticker==="BTC-LN") {
            //TODO: ENable if we want to support LNURL
            //if(!outAmountRef.current.validate()) return;
            if(!addressRef.current.validate()) return;
        }

        const process = () => {
            if(quoteUpdates.current!==updateNum) {
                return;
            }
            setQuoteLoading(true);
            let promise: Promise<ISwap>;
            if(inCurrency?.ticker==="BTC") {
                promise = props.swapper.createFromBTCSwap(outCurrency.address, fromHumanReadableString(amount, inCurrency));
            }
            if(inCurrency?.ticker==="BTC-LN") {
                promise = props.swapper.createFromBTCLNSwap(outCurrency.address, fromHumanReadableString(amount, inCurrency));
            }
            if(outCurrency?.ticker==="BTC") {
                promise = props.swapper.createToBTCSwap(inCurrency.address, address, fromHumanReadableString(amount, outCurrency));
            }
            if(outCurrency?.ticker==="BTC-LN") {
                promise = props.swapper.createToBTCLNSwap(inCurrency.address, address, 5*24*60*60);
            }
            currentQuotation.current = promise.then((swap) => {
                if(quoteUpdates.current!==updateNum) {
                    return;
                }
                setQuoteLoading(false);
                setQuote(swap);
            }).catch(e => {
                if(quoteUpdates.current!==updateNum) {
                    return;
                }
                setQuoteLoading(false);
                setQuoteError(e.toString());
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

    return (
        <>
            <Topbar selected={0} enabled={!locked}/>

            <div className="d-flex flex-column flex-fill align-items-center bg-dark text-white">
                <Card className="p-3 swap-panel border-0 mx-3">
                    <Card className="d-flex flex-row bg-dark bg-opacity-10 border-0 p-3">
                        <ValidatedInput
                            disabled={locked || (exactIn && disabled)}
                            inputRef={inAmountRef}
                            className="flex-fill strip-group-text"
                            type="number"
                            value={kind==="tobtc" ? (quote==null ? "" : toHumanReadableString(quote.getInAmount(), inCurrency)) : amount }
                            size={"lg"}
                            textStart={kind==="tobtc" && quoteLoading ? (
                                <Spinner size="sm"/>
                            ) : null}
                            onChange={val => {
                                if(kind==="tobtc") return;
                                setAmount(val);
                                setExactIn(true);
                            }}
                            step={inCurrency==null ? new BigNumber("0.00000001") : new BigNumber(10).pow(new BigNumber(-inCurrency.decimals))}
                            min={kind==="frombtc" ? btcAmountConstraints.min : new BigNumber(0)}
                            max={kind==="frombtc" ? btcAmountConstraints.max : null}
                            onValidate={exactIn ? (val: any) => {
                                return val==="" ? "Amount cannot be empty" : null;
                            } : null}
                        />
                        <CurrencyDropdown currencyList={kind==="frombtc" ? bitcoinCurrencies : props.supportedCurrencies} onSelect={val => {
                            if(locked) return;
                            setInCurrency(val);
                        }} value={inCurrency} />
                    </Card>
                    <div className="d-flex justify-content-center swap-direction-wrapper">
                        <Button onClick={changeDirection} size="lg" className="px-0 swap-direction-btn">
                            ↓
                        </Button>
                    </div>
                    <Card className="bg-dark bg-opacity-10 border-0 p-3">
                        <div className="d-flex flex-row">
                            <ValidatedInput
                                disabled={locked || (!exactIn && disabled)}
                                inputRef={outAmountRef}
                                className="flex-fill strip-group-text"
                                type="number"
                                value={kind==="frombtc" ? (quote==null ? "" : toHumanReadableString(quote.getOutAmount(), outCurrency)) : amount }
                                size={"lg"}
                                textStart={kind==="frombtc" && quoteLoading ? (
                                    <Spinner size="sm"/>
                                ) : null}
                                onChange={val => {
                                    if(kind==="frombtc") return;
                                    setAmount(val);
                                    setExactIn(false);
                                }}
                                step={outCurrency==null ? new BigNumber("0.00000001") : new BigNumber(10).pow(new BigNumber(-outCurrency.decimals))}
                                min={kind==="tobtc" ? btcAmountConstraints.min : new BigNumber(0)}
                                max={kind==="tobtc" ? btcAmountConstraints.max : null}
                                onValidate={!exactIn ? (val: any) => {
                                    return val==="" ? "Amount cannot be empty" : null;
                                } : null}
                            />
                            <CurrencyDropdown currencyList={kind==="tobtc" ? bitcoinCurrencies : props.supportedCurrencies} onSelect={(val) => {
                                if(locked) return;
                                setOutCurrency(val);
                                if(kind==="tobtc" && val!==outCurrency) {
                                    setDisabled(false);
                                    setAddress("");
                                }
                            }} value={outCurrency} />
                        </div>
                        {kind==="tobtc" ? (
                            <ValidatedInput
                                type={"text"}
                                className="flex-fill mt-3"
                                value={address}
                                onChange={(val) => {
                                    setAddress(val);
                                    if(props.swapper.isValidBitcoinAddress(val)) {
                                        setOutCurrency(bitcoinCurrencies[0]);
                                        setDisabled(false);
                                        if(outAmountRef.current.validate()) {
                                            const currentAmt = fromHumanReadableString(amount, bitcoinCurrencies[0]);
                                            const min = props.swapper.getMinimum(SwapType.TO_BTC);
                                            const max = props.swapper.getMaximum(SwapType.TO_BTC);
                                            if(currentAmt.lt(min)) {
                                                setAmount(toHumanReadableString(min, bitcoinCurrencies[0]));
                                            }
                                            if(currentAmt.gt(max)) {
                                                setAmount(toHumanReadableString(max, bitcoinCurrencies[0]));
                                            }
                                        }
                                    }
                                    if(props.swapper.isValidLightningInvoice(val)) {
                                        setOutCurrency(bitcoinCurrencies[1]);
                                        const outAmt = props.swapper.getLightningInvoiceValue(val);
                                        setAmount(toHumanReadableString(outAmt, btcCurrency));
                                        setDisabled(true);
                                        return;
                                    }
                                    setDisabled(false);
                                }}
                                inputRef={addressRef}
                                placeholder={"Paste Bitcoin/Lightning address"}
                                onValidate={(val) => {
                                    return props.swapper.isValidBitcoinAddress(val) || props.swapper.isValidLightningInvoice(val) ? null
                                        : "Invalid bitcoin address/lightning network invoice";
                                }}
                            />
                        ) : ""}
                    </Card>
                    {quote!=null ? (
                        <>
                            <div className="mt-3">
                                <SimpleFeeSummaryScreen swap={quote}/>
                            </div>
                            <div className="mt-3">
                                <QuoteSummary quote={quote} refreshQuote={getQuote} setAmountLock={setLocked}/>
                            </div>
                        </>
                    ) : ""}
                </Card>
            </div>
        </>
    )

}
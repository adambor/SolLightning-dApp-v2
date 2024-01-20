import {FromBTCSwap, IFromBTCSwap, ISwap, IToBTCSwap, LNURLPay, LNURLWithdraw, SolanaSwapper, SwapType, ToBTCSwap} from "sollightning-sdk";
import {Accordion, Alert, Button, Card, Spinner} from "react-bootstrap";
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
import {ic_arrow_downward} from 'react-icons-kit/md/ic_arrow_downward'
import * as bitcoin from "bitcoinjs-lib";
import {randomBytes} from "crypto";
import {FEConstants} from "../../FEConstants";

const defaultConstraints = {
    min: new BigNumber("0.000001"),
    max: null
};

const RANDOM_BTC_ADDRESS = bitcoin.payments.p2wsh({
    hash: randomBytes(32),
    network: FEConstants.chain==="DEVNET" ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
}).address;

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

    const [address, setAddress] = useState<string>();
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
        setAddress("");
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

    return (
        <>
            <Topbar selected={0} enabled={!locked}/>

            <div className="d-flex flex-column flex-fill align-items-center text-white">
                <Card className="p-3 swap-panel tab-bg mx-3 mb-3 border-0">

                    <Alert className="text-center" show={quoteError!=null} variant="danger" onClose={() => setQuoteError(null)} dismissible closeVariant="white">
                        <strong>Quoting error</strong>
                        <label>{quoteError}</label>
                    </Alert>

                    <Card className="d-flex flex-row tab-accent-p3">
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
                                }} value={inCurrency} className="round-right bg-transparent text-white"/>
                            )}
                        />
                    </Card>
                    <div className="d-flex justify-content-center swap-direction-wrapper">
                        <Button onClick={changeDirection} size="lg" className="px-0 swap-direction-btn">
                            <Icon size={24} icon={ic_arrow_downward} style={{marginTop: "-3px", marginBottom: "2px"}}/>
                        </Button>
                    </div>
                    <Card className="tab-accent-p3">
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
                                            setAddress("");
                                        }
                                    }} value={outCurrency} className="round-right bg-transparent text-white"/>
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
                                        if(props.swapper.isValidLNURL(val)) {
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
                                />
                                {outCurrency===bitcoinCurrencies[1] && !props.swapper.isValidLightningInvoice(address) && !props.swapper.isValidLNURL(address) ? (
                                    <Alert variant={"success"} className="mt-3 mb-0 text-center">
                                        <label>We only support lightning network invoices with pre-set amount!</label>
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
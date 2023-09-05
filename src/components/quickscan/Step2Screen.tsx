import ValidatedInput, {ValidatedInputRef} from "../ValidatedInput";
import {CurrencyDropdown} from "../CurrencyDropdown";
import {useEffect, useRef, useState} from "react";
import {FeeSummaryScreen} from "../FeeSummaryScreen";
import {Alert, Button, Spinner} from "react-bootstrap";
import {ISwap, SolanaSwapper, SwapType} from "sollightning-sdk";
import BigNumber from "bignumber.js";
import * as BN from "bn.js";
import {
    btcCurrency,
    CurrencySpec,
    fromHumanReadable,
    smartChainCurrencies,
    toHumanReadable
} from "../../utils/Currencies";
import {QuoteSummary} from "../quotes/QuoteSummary";
import {useLocation, useNavigate} from "react-router-dom";
import {Topbar} from "../Topbar";
import * as React from "react";

export function Step2Screen(props: {
    swapper: SolanaSwapper
}) {

    const navigate = useNavigate();

    const {search} = useLocation() as {search: string};
    const params = new URLSearchParams(search);
    const propAddress = params.get("address") || params.get("lightning");

    const [selectedCurrency, setSelectedCurrency] = useState<CurrencySpec>(null);

    const [lnurlLoading, setLnurlLoading] = useState<boolean>(false);
    const [addressError, setAddressError] = useState<string>(null);
    const [address, setAddress] = useState<string>(null);
    const [isLnurl, setLnurl] = useState<boolean>(false);

    const [amountConstraints, setAmountConstraints] = useState<{
        min: BigNumber,
        max: BigNumber
    }>(null);
    const [amount, setAmount] = useState<string>(null);
    const amountRef = useRef<ValidatedInputRef>();

    const [type, setType] = useState<"send" | "receive">("send");
    const [network, setNetwork] = useState<"ln" | "btc">("ln");

    const [quoteLoading, setQuoteLoading] = useState<boolean>(null);
    const [quoteError, setQuoteError] = useState<string>(null);
    const [quote, setQuote] = useState<ISwap>(null);

    const [isLocked, setLocked] = useState<boolean>(false);

    useEffect(() => {
        console.log("Prop address: ", propAddress);

        if(propAddress==null) {
            navigate("/scan");
            return;
        }

        if(props.swapper!=null) {

            let lightning: boolean = false;
            let resultText: string = propAddress;
            if(resultText.startsWith("lightning:")) {
                resultText = resultText.substring(10);
            }
            let _amount: string = null;
            if(resultText.startsWith("bitcoin:")) {
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

            setAmountConstraints(null);
            setLnurlLoading(false);
            setAddressError(null);
            setLnurl(false);
            setAddress(resultText);

            if(props.swapper.isValidBitcoinAddress(resultText)) {
                //On-chain send
                setType("send");
                if(_amount!=null) {
                    const amountBN = new BigNumber(_amount);
                    const amountSolBN = fromHumanReadable(amountBN, btcCurrency);
                    const min = props.swapper.getMinimum(SwapType.TO_BTC);
                    const max = props.swapper.getMaximum(SwapType.TO_BTC);
                    if(amountSolBN.lt(min)) {
                        setAddressError("Payment amount ("+amountBN.toString(10)+" BTC) is below minimum swappable amount ("+toHumanReadable(min, btcCurrency).toString(10)+" BTC)");
                        return;
                    }
                    if(amountSolBN.gt(max)) {
                        setAddressError("Payment amount ("+amountBN.toString(10)+" BTC) is above maximum swappable amount ("+toHumanReadable(max, btcCurrency).toString(10)+" BTC)");
                        return;
                    }
                    setAmountConstraints({
                        min: amountBN,
                        max: amountBN,
                    });
                    setAmount(amountBN.toString(10));
                } else {
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
            if(props.swapper.isValidLightningInvoice(resultText)) {
                //Lightning send
                setType("send");

                const amountSolBN = props.swapper.getLightningInvoiceValue(resultText);
                const min = props.swapper.getMinimum(SwapType.TO_BTCLN);
                const max = props.swapper.getMaximum(SwapType.TO_BTCLN);
                if(amountSolBN.lt(min)) {
                    setAddressError("Payment amount ("+toHumanReadable(amountSolBN, btcCurrency).toString(10)+") is below minimum swappable amount ("+toHumanReadable(min, btcCurrency).toString(10)+" BTC)");
                    return;
                }
                if(amountSolBN.gt(max)) {
                    setAddressError("Payment amount ("+toHumanReadable(amountSolBN, btcCurrency).toString(10)+") is above maximum swappable amount ("+toHumanReadable(max, btcCurrency).toString(10)+" BTC)");
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
            if(props.swapper.isValidLNURL(resultText)) {
                //Check LNURL type
                setLnurlLoading(true);
                setLnurl(true);
                setNetwork("ln");
                props.swapper.getLNURLTypeAndData(resultText).then((result) => {
                    setLnurlLoading(false);
                    if(result==null) {
                        setAddressError("Invalid LNURL, cannot process");
                        return;
                    }
                    if(result.type==="pay") {
                        setType("send");
                        const min = props.swapper.getMinimum(SwapType.TO_BTCLN);
                        const max = props.swapper.getMaximum(SwapType.TO_BTCLN);
                        if(result.min.gt(max)) {
                            setAddressError("Minimum payable amount ("+toHumanReadable(result.min, btcCurrency).toString(10)+" BTC) is above maximum swappable amount ("+toHumanReadable(max, btcCurrency).toString(10)+" BTC)");
                            return;
                        }
                        if(result.max.lt(min)) {
                            setAddressError("Maximum payable amount ("+toHumanReadable(result.max, btcCurrency).toString(10)+" BTC) is below minimum swappable amount ("+toHumanReadable(min, btcCurrency).toString(10)+" BTC)");
                            return;
                        }
                        setAmountConstraints({
                            min: toHumanReadable(BN.max(result.min, min), btcCurrency),
                            max: toHumanReadable(BN.min(result.max, max), btcCurrency),
                        });
                        setAmount(toHumanReadable(BN.max(result.min, min), btcCurrency).toString(10));
                    }
                    if(result.type==="withdraw") {
                        setType("receive");
                        const min = props.swapper.getMinimum(SwapType.FROM_BTCLN);
                        const max = props.swapper.getMaximum(SwapType.FROM_BTCLN);
                        if(result.min.gt(max)) {
                            setAddressError("Minimum withdrawable amount ("+toHumanReadable(result.min, btcCurrency).toString(10)+" BTC) is above maximum swappable amount ("+toHumanReadable(max, btcCurrency).toString(10)+" BTC)");
                            return;
                        }
                        if(result.max.lt(min)) {
                            setAddressError("Maximum withdrawable amount ("+toHumanReadable(result.max, btcCurrency).toString(10)+" BTC) is below minimum swappable amount ("+toHumanReadable(min, btcCurrency).toString(10)+" BTC)");
                            return;
                        }
                        setAmountConstraints({
                            min: toHumanReadable(BN.max(result.min, min), btcCurrency),
                            max: toHumanReadable(BN.min(result.max, max), btcCurrency),
                        });
                        setAmount(toHumanReadable(BN.min(result.max, max), btcCurrency).toString(10));
                    }
                    setNetwork("ln");
                }).catch((e) => {
                    setLnurlLoading(false);
                    setAddressError("Failed to contact LNURL service, check you internet connection and retry later.");
                });
                return;
            }

            setAddressError("Invalid address, lightning invoice or LNURL!");
        }
    }, [propAddress, props.swapper]);

    const quoteUpdates = useRef<number>(0);
    const currentQuotation = useRef<Promise<any>>(Promise.resolve());

    const getQuote = () => {
        if(amount!=null && selectedCurrency!=null) {
            setQuote(null);
            setQuoteError(null);
            quoteUpdates.current++;
            const updateNum = quoteUpdates.current;
            if(!amountRef.current.validate()) return;
            const process = () => {
                if(quoteUpdates.current!==updateNum) {
                    return;
                }
                setQuoteLoading(true);
                let promise;
                if(type==="send") {
                    if(network==="btc") {
                        promise = props.swapper.createToBTCSwap(selectedCurrency.address, address, fromHumanReadable(new BigNumber(amount), btcCurrency));
                    }
                    if(network==="ln") {
                        if(isLnurl) {
                            promise = props.swapper.createToBTCLNSwapViaLNURL(selectedCurrency.address, address, fromHumanReadable(new BigNumber(amount), btcCurrency), "", 5*24*60*60);
                        } else {
                            promise = props.swapper.createToBTCLNSwap(selectedCurrency.address, address, 5*24*60*60);
                        }
                    }
                } else {
                    promise = props.swapper.createFromBTCLNSwapViaLNURL(selectedCurrency.address, address, fromHumanReadable(new BigNumber(amount), btcCurrency), true);
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
        }
    };

    useEffect(() => {
        getQuote();
    }, [amount, selectedCurrency]);

    const goBack = () => {
        navigate("/scan");
    };

    return (
        <>
            <Topbar selected={1} enabled={!isLocked}/>

            <div className="d-flex flex-column flex-fill justify-content-center align-items-center bg-dark text-white">
                <div className="p-3 quickscan-summary-panel flex-fill d-flex flex-column">

                    <ValidatedInput
                        type={"text"}
                        className="mb-3"
                        disabled={true}
                        value={address}
                    />

                    {addressError ? (
                        <Alert variant={"danger"}>
                            <p><strong>Destination parsing error</strong></p>
                            {addressError}
                        </Alert>
                    ) : ""}

                    {lnurlLoading ? (
                        <div className="d-flex flex-column align-items-center justify-content-center">
                            <Spinner animation="border" />
                            Loading data...
                        </div>
                    ) : ""}

                    {addressError==null && props.swapper!=null && !lnurlLoading ? (
                        <div className="mb-4">
                            <label className="fw-bold mb-1">{type==="send" ? "Pay" : "Withdraw"}</label>

                            <ValidatedInput
                                type={"number"}
                                textEnd={(
                                    <>
                                        <img src={btcCurrency.icon} className="currency-icon"/>
                                        BTC
                                    </>
                                )}
                                step={new BigNumber(10).pow(new BigNumber(-btcCurrency.decimals))}
                                min={amountConstraints==null ? new BigNumber(0) : amountConstraints.min}
                                max={amountConstraints?.max}
                                disabled={
                                    (amountConstraints!=null && amountConstraints.min.eq(amountConstraints.max)) ||
                                    isLocked
                                }
                                size={"lg"}
                                inputRef={amountRef}
                                value={amount}
                                onChange={setAmount}
                                placeholder={"Input amount"}
                            />

                            <label className="fw-bold mb-1">{type==="send" ? "with" : "to"}</label>

                            <CurrencyDropdown currencyList={smartChainCurrencies} onSelect={val => {
                                if(isLocked) return;
                                setSelectedCurrency(val);
                            }} value={selectedCurrency}/>
                        </div>
                    ) : ""}

                    {quoteLoading? (
                        <div className="d-flex flex-column align-items-center justify-content-center">
                            <Spinner animation="border" />
                            Fetching quote...
                        </div>
                    ) : ""}

                    {quoteError ? (
                        <Alert variant={"danger"}>
                            <p><strong>Quoting error</strong></p>
                            {quoteError}
                        </Alert>
                    ) : ""}

                    {quoteError || addressError ? (
                        <Button variant="secondary" onClick={goBack}>
                            Back
                        </Button>
                    ) : ""}

                    {quote!=null ? (
                        <>
                            <FeeSummaryScreen swap={quote} className="mb-3"/>
                            <QuoteSummary setAmountLock={setLocked} type={"payment"} quote={quote} refreshQuote={getQuote}/>
                        </>
                    ) : ""}

                    <div className="d-flex mt-auto pt-4">
                        <Button variant="secondary flex-fill" disabled={isLocked} onClick={goBack}>
                            &lt; Back
                        </Button>
                    </div>


                </div>
            </div>
        </>
    );
}
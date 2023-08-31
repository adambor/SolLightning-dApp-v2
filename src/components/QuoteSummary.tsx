import {useEffect, useRef, useState} from "react";
import {Alert, Button, ProgressBar, Spinner} from "react-bootstrap";
import {FromBTCLNSwap, FromBTCLNSwapState, FromBTCSwap, FromBTCSwapState, IFromBTCSwap, ISwap, IToBTCSwap} from "sollightning-sdk";
import {QRCodeSVG} from 'qrcode.react';
import {qualifiedTypeIdentifier} from "@babel/types";
import {btcCurrency, toHumanReadableString} from "../utils/Currencies";
import ValidatedInput from "./ValidatedInput";


function FromBTCQuoteSummary(props: {
    quote: FromBTCSwap<any>,
    refreshQuote: () => void,
    setAmountLock: (isLocked: boolean) => void,
    type?: "payment" | "swap"
}) {

    const [state, setState] = useState<FromBTCSwapState>(null);

    const [quoteTimeRemaining, setQuoteTimeRemaining] = useState<number>();
    const [initialQuoteTimeout, setInitialQuoteTimeout] = useState<number>();
    const expiryTime = useRef<number>();

    const [loading, setLoading] = useState<boolean>();
    const [success, setSuccess] = useState<boolean>();
    const [error, setError] = useState<string>();

    const [txData, setTxData] = useState<{
        txId: string,
        confirmations: number,
        confTarget: number
    }>(null);

    useEffect(() => {

        if(props.quote==null) return () => {};

        setSuccess(null);
        setError(null);

        let interval;
        interval = setInterval(() => {
            let dt = expiryTime.current-Date.now();
            if(dt<=0) {
                clearInterval(interval);
                dt = 0;
            }
            setQuoteTimeRemaining(Math.floor(dt/1000));
        }, 500);

        expiryTime.current = props.quote.getExpiry();

        const dt = Math.floor((expiryTime.current-Date.now())/1000);
        setInitialQuoteTimeout(dt);
        setQuoteTimeRemaining(dt);

        let listener;

        const abortController = new AbortController();

        let paymentSubscribed = false;

        // setState(FromBTCSwapState.CLAIM_COMMITED);
        // setTxData({
        //     txId: "c2a779af671bccd5d0b17e4327a2aefbf465eb39097f0b2a7c702689dbfa09b2",
        //     confirmations: 0,
        //     confTarget: 2
        // });

        const stateChange = (state: FromBTCSwapState) => {
            setState(state);
            if(state===FromBTCSwapState.CLAIM_COMMITED) {
                if(!paymentSubscribed) {
                    props.quote.waitForPayment(abortController.signal, null, (txId: string, confirmations: number, confirmationTarget: number) => {
                        setTxData({
                            txId,
                            confirmations,
                            confTarget: confirmationTarget
                        });
                    });
                    let paymentInterval;
                    paymentInterval = setInterval(() => {
                        if(abortController.signal.aborted) {
                            clearInterval(paymentInterval);
                            return;
                        }
                        let dt = expiryTime.current-Date.now();
                        if(dt<=0) {
                            clearInterval(interval);
                            dt = 0;
                        }
                        setQuoteTimeRemaining(Math.floor(dt/1000));
                    }, 500);

                    expiryTime.current = props.quote.getTimeoutTime();
                    const dt = Math.floor((expiryTime.current-Date.now())/1000);
                    setInitialQuoteTimeout(dt);
                    setQuoteTimeRemaining(dt);
                }
                paymentSubscribed = true;
            }
            if(state===FromBTCSwapState.CLAIM_CLAIMED) {
                if(props.setAmountLock) props.setAmountLock(false);
            }
        };

        stateChange(props.quote.getState());

        props.quote.events.on("swapState", listener = (quote: FromBTCSwap<any>) => {
            stateChange(quote.getState());
        });

        return () => {
            clearInterval(interval);
            props.quote.events.removeListener("swapState", listener);
            abortController.abort();
        };

    }, [props.quote]);

    const onCommit = async () => {
        setLoading(true);
        try {
            if(props.setAmountLock) props.setAmountLock(true);
            await props.quote.commit();
        } catch (e) {
            if(props.setAmountLock) props.setAmountLock(false);
            setError(e.toString());
            expiryTime.current = 0;
            setQuoteTimeRemaining(0);
        }
        setLoading(false);
    };

    const onClaim = async () => {
        setLoading(true);
        try {
            await props.quote.claim();
            setLoading(false);
            setSuccess(true);
        } catch (e) {
            setSuccess(false);
            setError(e.toString());
        }
    };

    return (
        <>
            {error!=null ? (
                <Alert variant="danger" className="mb-3">
                    <p><strong>Swap failed</strong></p>
                    {error}
                </Alert>
            ) : ""}

            {state===FromBTCSwapState.PR_CREATED ? (
                <>
                    <div className={success===null && !loading ? "d-flex flex-column mb-3" : "d-none"}>
                        {quoteTimeRemaining===0 ? (
                            <label>Quote expired!</label>
                        ) : (
                            <label>Quote expires in {quoteTimeRemaining} seconds</label>
                        )}
                        <ProgressBar animated now={quoteTimeRemaining} max={initialQuoteTimeout} min={0}/>
                    </div>
                    {quoteTimeRemaining===0 ? (
                        <Button onClick={props.refreshQuote} variant="secondary">
                            New quote
                        </Button>
                    ) : (
                        <Button onClick={onCommit} disabled={loading} size="lg">
                            {loading ? <Spinner animation="border" size="sm" className="mr-2"/> : ""}
                            Initiate swap
                        </Button>
                    )}
                </>
            ) : ""}

            {state===FromBTCSwapState.CLAIM_COMMITED ? (txData==null ? (
                <>
                    <QRCodeSVG
                        value={props.quote.getQrData()}
                        size={300}
                        includeMargin={true}
                    />
                    <div className="d-flex flex-column my-3">
                        {quoteTimeRemaining===0 ? (
                            <label>Swap address expired, please do not send any funds!</label>
                        ) : (
                            <label>Swap address expires in {quoteTimeRemaining} seconds</label>
                        )}
                        <ProgressBar animated now={quoteTimeRemaining} max={initialQuoteTimeout} min={0}/>
                    </div>
                    {quoteTimeRemaining===0 ? "" : (
                        <>
                            <label>Please send exactly {toHumanReadableString(props.quote.getInAmount(), btcCurrency)} {btcCurrency.ticker} to the address</label>
                            <ValidatedInput
                                type={"text"}
                                value={props.quote.getAddress()}
                            />
                        </>
                    )}
                </>
            ) : (
                <div className="d-flex flex-column align-items-center">
                    <label>Transaction successfully received, waiting for confirmations...</label>

                    <Spinner/>
                    <label>{txData.confirmations} / {txData.confTarget}</label>
                    <label>Confirmations</label>
                </div>
            )) : ""}

            {state===FromBTCSwapState.BTC_TX_CONFIRMED ? (
                <>
                    <label>Transaction received & confirmed</label>

                    <Button onClick={onClaim} disabled={loading} size="lg">
                        {loading ? <Spinner animation="border" size="sm" className="mr-2"/> : ""}
                        Finish swap (claim funds)
                    </Button>
                </>
            ) : ""}

            {state===FromBTCSwapState.CLAIM_CLAIMED ? (
                <Alert variant="success">
                    <p><strong>Swap successful</strong></p>
                    Swap was concluded successfully
                </Alert>
            ) : ""}

        </>
    )
}

function FromBTCLNQuoteSummary(props: {
    quote: FromBTCLNSwap<any>,
    refreshQuote: () => void,
    setAmountLock: (isLocked: boolean) => void,
    type?: "payment" | "swap"
}) {

    const [state, setState] = useState<FromBTCLNSwapState>(null);

    const [quoteTimeRemaining, setQuoteTimeRemaining] = useState<number>();
    const [initialQuoteTimeout, setInitialQuoteTimeout] = useState<number>();
    const expiryTime = useRef<number>();

    const [isStarted, setStarted] = useState<boolean>();
    const [loading, setLoading] = useState<boolean>();
    const [success, setSuccess] = useState<boolean>();
    const [error, setError] = useState<string>();

    const abortControllerRef = useRef<AbortController>(new AbortController());

    useEffect(() => {

        abortControllerRef.current = new AbortController();

        if(props.quote==null) return () => {};

        setSuccess(null);
        setError(null);

        let interval;
        interval = setInterval(() => {
            let dt = expiryTime.current-Date.now();
            if(dt<=0) {
                clearInterval(interval);
                dt = 0;
            }
            setQuoteTimeRemaining(Math.floor(dt/1000));
        }, 500);

        expiryTime.current = Date.now()+(30*1000);

        const dt = Math.floor((expiryTime.current-Date.now())/1000);
        setInitialQuoteTimeout(dt);
        setQuoteTimeRemaining(dt);

        let listener;

        setState(props.quote.getState());
        // setState(FromBTCLNSwapState.PR_CREATED);

        props.quote.events.on("swapState", listener = (quote: FromBTCLNSwap<any>) => {
            setState(quote.getState());
            if(quote.getState()===FromBTCLNSwapState.CLAIM_CLAIMED) {
                if(props.setAmountLock) props.setAmountLock(false);
            }
            if(quote.getState()===FromBTCLNSwapState.PR_PAID) {
                clearInterval(interval);
                interval = setInterval(() => {
                    let dt = expiryTime.current-Date.now();
                    if(dt<=0) {
                        clearInterval(interval);
                        dt = 0;
                        if(props.setAmountLock!=null) props.setAmountLock(false);
                    }
                    setQuoteTimeRemaining(Math.floor(dt/1000));
                }, 500);

                expiryTime.current = quote.getExpiry();

                const dt = Math.floor((expiryTime.current-Date.now())/1000);
                setInitialQuoteTimeout(dt);
                setQuoteTimeRemaining(dt);
            }
        });

        return () => {
            clearInterval(interval);
            props.quote.events.removeListener("swapState", listener);
            abortControllerRef.current.abort();
        };

    }, [props.quote]);

    const onCommit = async () => {
        setStarted(true);
        if(props.setAmountLock!=null) props.setAmountLock(true);
        props.quote.waitForPayment(abortControllerRef.current.signal);
    };

    const onClaim = async () => {
        setLoading(true);
        try {
            await props.quote.commitAndClaim();
            setLoading(false);
            setSuccess(true);
        } catch (e) {
            setSuccess(false);
            setError(e.toString());
        }
    };

    return (
        <>
            {error!=null ? (
                <Alert variant="danger" className="mb-3">
                    <p><strong>Swap failed</strong></p>
                    {error}
                </Alert>
            ) : ""}

            {state===FromBTCLNSwapState.PR_CREATED ? (!isStarted ? (
                <>
                    <div className={success===null && !loading ? "d-flex flex-column mb-3" : "d-none"}>
                        {quoteTimeRemaining===0 ? (
                            <label>Quote expired!</label>
                        ) : (
                            <label>Quote expires in {quoteTimeRemaining} seconds</label>
                        )}
                        <ProgressBar animated now={quoteTimeRemaining} max={initialQuoteTimeout} min={0}/>
                    </div>
                    {quoteTimeRemaining===0 ? (
                        <Button onClick={props.refreshQuote} variant="secondary">
                            New quote
                        </Button>
                    ) : (
                        <Button onClick={onCommit} disabled={loading} size="lg">
                            {loading ? <Spinner animation="border" size="sm" className="mr-2"/> : ""}
                            Initiate swap
                        </Button>
                    )}
                </>
            ) : (
                <>
                    <QRCodeSVG
                        value={props.quote.getQrData()}
                        size={300}
                        includeMargin={true}
                    />
                    <label>Please initiate a payment to this lightning network invoice</label>
                    <ValidatedInput
                        type={"text"}
                        value={props.quote.getAddress()}
                    />
                </>
            )) : ""}

            {state===FromBTCLNSwapState.PR_PAID || state===FromBTCLNSwapState.CLAIM_COMMITED ? (
                <>
                    {quoteTimeRemaining!==0 ? (
                        <div className="mb-3">
                            <label>Lightning network payment received</label>
                            <label>Claim it below to finish the swap!</label>
                        </div>
                    ) : ""}
                    {state===FromBTCLNSwapState.PR_PAID ? (
                        <div className={success===null && !loading ? "d-flex flex-column mb-3" : "d-none"}>
                            {quoteTimeRemaining===0 ? (
                                <label>Swap expired! Your lightning payment should refund shortly.</label>
                            ) : (
                                <label>Offer expires in {quoteTimeRemaining} seconds</label>
                            )}
                            <ProgressBar animated now={quoteTimeRemaining} max={initialQuoteTimeout} min={0}/>
                        </div>
                    ) : ""}

                    {quoteTimeRemaining===0 ? (
                        <Button onClick={props.refreshQuote} variant="secondary">
                            New quote
                        </Button>
                    ) : (
                        <Button onClick={onClaim} disabled={loading} size="lg">
                            {loading ? <Spinner animation="border" size="sm" className="mr-2"/> : ""}
                            Finish swap (claim funds)
                        </Button>
                    )}
                </>
            ) : ""}

            {state===FromBTCLNSwapState.CLAIM_CLAIMED ? (
                <Alert variant="success">
                    <p><strong>Swap successful</strong></p>
                    Swap was concluded successfully
                </Alert>
            ) : ""}

        </>
    )
}

function ToBTCQuoteSummary(props: {
    quote: IToBTCSwap<any>,
    refreshQuote: () => void,
    setAmountLock: (isLocked: boolean) => void,
    type?: "payment" | "swap"
}) {

    const [quoteTimeRemaining, setQuoteTimeRemaining] = useState<number>();
    const [initialQuoteTimeout, setInitialQuoteTimeout] = useState<number>();
    const expiryTime = useRef<number>();

    const [loading, setLoading] = useState<boolean>();
    const [success, setSuccess] = useState<boolean>();
    const [refund, setRefund] = useState<boolean>();
    const [error, setError] = useState<string>();

    const [refunding, setRefunding] = useState<boolean>();
    const [refunded, setRefunded] = useState<boolean>();

    useEffect(() => {

        if(props.quote==null) return () => {};

        setSuccess(null);
        setRefund(false);
        setError(null);
        setRefunding(false);
        setRefunded(false);

        let interval;
        interval = setInterval(() => {
            let dt = expiryTime.current-Date.now();
            if(dt<=0) {
                clearInterval(interval);
                dt = 0;
            }
            setQuoteTimeRemaining(Math.floor(dt/1000));
        }, 500);

        expiryTime.current = props.quote.getExpiry();

        const dt = Math.floor((expiryTime.current-Date.now())/1000);
        setInitialQuoteTimeout(dt);
        setQuoteTimeRemaining(dt);

        return () => {
            clearInterval(interval);
        };

    }, [props.quote]);

    const onContinue = async () => {
        setLoading(true);
        try {
            const neededToPay = props.quote.getInAmount();

            const balance = await props.quote.getWrapper().getBalance(props.quote.data.getToken());
            const hasEnoughBalance = balance.gte(neededToPay);

            if(!hasEnoughBalance) {
                setSuccess(false);
                setError("Not enough funds to initiate the swap");
                setLoading(false);
                return;
            }

            if(props.setAmountLock) props.setAmountLock(true);
            await props.quote.commit();
            const success = await props.quote.waitForPayment();
            if(success) {
                setSuccess(true);
                if(props.setAmountLock) props.setAmountLock(false);
            } else {
                setSuccess(false);
                setRefund(true);
                setError("Swap failed, you can refund your prior deposit");
            }
        } catch (e) {
            setSuccess(false);
            setError(e.toString());
            if(props.setAmountLock) props.setAmountLock(false);
        }
        setLoading(false);
    };

    const onRefund = async () => {
        setRefunding(true);
        try {
            await props.quote.refund();
            setRefunded(true);
            setError("Deposit refunded successfully");
            if(props.setAmountLock) props.setAmountLock(false);
        } catch (e) {

        }
        setRefunding(false);
    };

    return (
        <>
            <div className={success===null && !loading ? "d-flex flex-column mb-3" : "d-none"}>
                {quoteTimeRemaining===0 ? (
                    <label>Quote expired!</label>
                ) : (
                    <label>Quote expires in {quoteTimeRemaining} seconds</label>
                )}
                <ProgressBar animated now={quoteTimeRemaining} max={initialQuoteTimeout} min={0}/>
            </div>

            {success===null ? (
                quoteTimeRemaining===0 ? (
                    <Button onClick={props.refreshQuote} variant="secondary">
                        New quote
                    </Button>
                ) : (
                    <Button onClick={onContinue} disabled={loading} size="lg">
                        {loading ? <Spinner animation="border" size="sm" className="mr-2"/> : ""}
                        {props.type==="payment" ? "Pay" : "Swap"}
                    </Button>
                )
            ) : (
                success ? (
                    <Alert variant="success">
                        <p><strong>Swap successful</strong></p>
                        Swap was concluded successfully
                    </Alert>
                ) : (
                    <>
                        <Alert variant="danger" className="mb-3">
                            <p><strong>Swap failed</strong></p>
                            {error}
                        </Alert>
                        {refund ? (
                            <Button onClick={onRefund} className={refunded ? "d-none" : ""} disabled={refunding} variant="secondary">
                                {refunding ? <Spinner animation="border" size="sm" className="mr-2"/> : ""}
                                Refund deposit
                            </Button>
                        ) : (
                            <Button onClick={props.refreshQuote} variant="secondary">New quote</Button>
                        )}
                    </>
                )
            )}

        </>
    )
}

function LNURLWithdrawQuoteSummary(props: {
    quote: FromBTCLNSwap<any>,
    refreshQuote: () => void,
    setAmountLock: (isLocked: boolean) => void,
    type?: "payment" | "swap"
}) {

    const [quoteTimeRemaining, setQuoteTimeRemaining] = useState<number>();
    const [initialQuoteTimeout, setInitialQuoteTimeout] = useState<number>();
    const expiryTime = useRef<number>();

    const [loading, setLoading] = useState<boolean>();
    const [success, setSuccess] = useState<boolean>();
    const [error, setError] = useState<string>();

    useEffect(() => {

        if(props.quote==null) return () => {};

        setSuccess(null);
        setError(null);

        let interval;
        interval = setInterval(() => {
            let dt = expiryTime.current-Date.now();
            if(dt<=0) {
                clearInterval(interval);
                dt = 0;
            }
            setQuoteTimeRemaining(Math.floor(dt/1000));
        }, 500);

        expiryTime.current = Date.now()+(30*1000);

        const dt = Math.floor((expiryTime.current-Date.now())/1000);
        setInitialQuoteTimeout(dt);
        setQuoteTimeRemaining(dt);

        return () => {
            clearInterval(interval);
        };

    }, [props.quote]);

    const onContinue = async () => {
        if (!props.quote.prPosted) {
            setLoading(true);
            try {
                if(props.setAmountLock) props.setAmountLock(true);
                await props.quote.waitForPayment();
                await props.quote.commitAndClaim();
                setSuccess(true);
            } catch (e) {
                setSuccess(false);
                setError(e.toString());
            }
            if(props.setAmountLock) props.setAmountLock(false);
            setLoading(false);
        }
    };

    return (
        <>
            <div className={success===null && !loading ? "d-flex flex-column mb-3" : "d-none"}>
                {quoteTimeRemaining===0 ? (
                    <label>Quote expired!</label>
                ) : (
                    <label>Quote expires in {quoteTimeRemaining} seconds</label>
                )}
                <ProgressBar animated now={quoteTimeRemaining} max={initialQuoteTimeout} min={0}/>
            </div>

            {success===null ? (
                quoteTimeRemaining===0 ? (
                    <Button onClick={props.refreshQuote} variant="secondary">
                        New quote
                    </Button>
                ) : (
                    <Button onClick={onContinue} disabled={loading} size="lg">
                        {loading ? <Spinner animation="border" size="sm" className="mr-2"/> : ""}
                        Claim
                    </Button>
                )
            ) : (
                success ? (
                    <Alert variant="success">
                        <p><strong>Swap successful</strong></p>
                        Swap was concluded successfully
                    </Alert>
                ) : (
                    <Alert variant="danger" className="mb-3">
                        <p><strong>Swap failed</strong></p>
                        {error}
                    </Alert>
                )
            )}

        </>
    )
}
export function QuoteSummary(props: {
    quote: ISwap,
    refreshQuote: () => void,
    setAmountLock?: (isLocked: boolean) => void,
    type?: "payment" | "swap"
}) {

    if(props.quote instanceof IToBTCSwap) return <ToBTCQuoteSummary type={props.type} setAmountLock={props.setAmountLock} quote={props.quote} refreshQuote={props.refreshQuote}/>;
    if(props.quote instanceof IFromBTCSwap) {
        if(props.quote instanceof FromBTCLNSwap) {
            if(props.quote.lnurl!=null) {
                return <LNURLWithdrawQuoteSummary type={props.type} setAmountLock={props.setAmountLock} quote={props.quote} refreshQuote={props.refreshQuote}/>;
            } else {
                return <FromBTCLNQuoteSummary type={props.type} setAmountLock={props.setAmountLock} quote={props.quote} refreshQuote={props.refreshQuote}/>;
            }
        }
        if(props.quote instanceof FromBTCSwap) return <FromBTCQuoteSummary type={props.type} setAmountLock={props.setAmountLock} quote={props.quote} refreshQuote={props.refreshQuote}/>;
    }

}
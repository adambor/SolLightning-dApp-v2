import {useEffect, useRef, useState} from "react";
import {Alert, Button, ProgressBar, Spinner} from "react-bootstrap";
import {QRCodeSVG} from "qrcode.react";
import ValidatedInput from "../../ValidatedInput";
import {FromBTCLNSwap, FromBTCLNSwapState} from "sollightning-sdk";
import {start} from "repl";

export function FromBTCLNQuoteSummary(props: {
    quote: FromBTCLNSwap<any>,
    refreshQuote: () => void,
    setAmountLock: (isLocked: boolean) => void,
    type?: "payment" | "swap",
    abortSwap?: () => void
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
                if(props.setAmountLock!=null) props.setAmountLock(false);
                abortControllerRef.current.abort();
            }
            setQuoteTimeRemaining(Math.floor(dt/1000));
        }, 500);

        expiryTime.current = props.quote.getTimeoutTime();

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
        props.quote.waitForPayment(abortControllerRef.current.signal).catch(e => {
            if(abortControllerRef.current.signal.aborted) return;
            setError(e.toString());
            if(props.setAmountLock!=null) props.setAmountLock(false);
        });
    };

    const onClaim = async () => {
        setLoading(true);
        try {
            await props.quote.commitAndClaim();
            setSuccess(true);
        } catch (e) {
            setSuccess(false);
            setError(e.toString());
        }
        setLoading(false);
    };

    useEffect(() => {
        if(isStarted) {
            // @ts-ignore
            window.scrollBy(0,99999);
        }
    }, [isStarted]);

    return (
        <>
            {error!=null ? (
                <Alert variant="danger" className="mb-3">
                    <strong>Swap failed</strong>
                    <label>{error}</label>
                </Alert>
            ) : ""}

            {state===FromBTCLNSwapState.PR_CREATED ? (!isStarted ? (
                <>
                    <div className={success===null && !loading ? "d-flex flex-column mb-3 tab-accent" : "d-none"}>
                        {quoteTimeRemaining===0 ? (
                            <label>Quote expired!</label>
                        ) : (
                            <label>Quote expires in {quoteTimeRemaining} seconds</label>
                        )}
                        <ProgressBar animated now={quoteTimeRemaining} max={initialQuoteTimeout} min={0}/>
                    </div>
                    {quoteTimeRemaining===0 && !loading ? (
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
                    {quoteTimeRemaining===0 ? "" : (
                        <div className="tab-accent mb-3">
                            <div>
                                <QRCodeSVG
                                    value={props.quote.getQrData()}
                                    size={300}
                                    includeMargin={true}
                                />
                            </div>
                            <label>Please initiate a payment to this lightning network invoice</label>
                            <ValidatedInput
                                type={"text"}
                                value={props.quote.getAddress()}
                            />
                        </div>
                    )}

                    <div className="d-flex flex-column mb-3 tab-accent">
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
                        <Button onClick={props.abortSwap} variant="danger">
                            Abort swap
                        </Button>
                    )}
                </>
            )) : ""}

            {state===FromBTCLNSwapState.PR_PAID || state===FromBTCLNSwapState.CLAIM_COMMITED ? (
                <>
                    {quoteTimeRemaining!==0 ? (
                        <div className="mb-3 tab-accent">
                            <label>Lightning network payment received</label>
                            <label>Claim it below to finish the swap!</label>
                        </div>
                    ) : ""}
                    {state===FromBTCLNSwapState.PR_PAID ? (
                        <div className={success===null && !loading ? "d-flex flex-column mb-3 tab-accent" : "d-none"}>
                            {quoteTimeRemaining===0 ? (
                                <label>Swap expired! Your lightning payment should refund shortly.</label>
                            ) : (
                                <label>Offer expires in {quoteTimeRemaining} seconds</label>
                            )}
                            <ProgressBar animated now={quoteTimeRemaining} max={initialQuoteTimeout} min={0}/>
                        </div>
                    ) : ""}

                    {quoteTimeRemaining===0 && !loading ? (
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
                <Alert variant="success" className="mb-0">
                    <strong>Swap successful</strong>
                    <label>Swap was concluded successfully</label>
                </Alert>
            ) : ""}

        </>
    )
}
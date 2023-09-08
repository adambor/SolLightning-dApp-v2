import {useEffect, useRef, useState} from "react";
import {Alert, Button, ProgressBar, Spinner} from "react-bootstrap";
import {IToBTCSwap} from "sollightning-sdk";

export
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
                quoteTimeRemaining===0 && !loading ? (
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
                    <Alert variant="success" className="mb-0">
                        <strong>Swap successful</strong>
                        <label>Swap was concluded successfully</label>
                    </Alert>
                ) : (
                    <>
                        <Alert variant="danger" className="mb-3">
                            <strong>Swap failed</strong>
                            <label>{error}</label>
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
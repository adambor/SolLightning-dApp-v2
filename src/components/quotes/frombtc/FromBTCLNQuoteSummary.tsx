import * as React from "react";
import {useEffect, useRef, useState} from "react";
import {Alert, Badge, Button, Form, Overlay, OverlayTrigger, ProgressBar, Spinner, Tooltip} from "react-bootstrap";
import {QRCodeSVG} from "qrcode.react";
import ValidatedInput, {ValidatedInputRef} from "../../ValidatedInput";
import {FromBTCLNSwap, FromBTCLNSwapState, LNURLPay, LNURLWithdraw, Swapper} from "sollightning-sdk";
import {clipboard} from 'react-icons-kit/fa/clipboard'
import Icon from "react-icons-kit";
import {LNNFCReader, LNNFCStartResult} from "../../lnnfc/LNNFCReader";
import {useLocation, useNavigate} from "react-router-dom";

export function FromBTCLNQuoteSummary(props: {
    swapper: Swapper<any, any, any, any>,
    quote: FromBTCLNSwap<any>,
    refreshQuote: () => void,
    setAmountLock: (isLocked: boolean) => void,
    type?: "payment" | "swap",
    abortSwap?: () => void,
    notEnoughForGas: boolean
}) {

    const navigate = useNavigate();
    const location = useLocation();

    const [state, setState] = useState<FromBTCLNSwapState>(null);

    const [quoteTimeRemaining, setQuoteTimeRemaining] = useState<number>();
    const [initialQuoteTimeout, setInitialQuoteTimeout] = useState<number>();
    const expiryTime = useRef<number>();

    const [isStarted, setStarted] = useState<boolean>();
    const [loading, setLoading] = useState<boolean>();
    const [success, setSuccess] = useState<boolean>();
    const [error, setError] = useState<string>();

    const abortControllerRef = useRef<AbortController>(new AbortController());

    const qrCodeRef = useRef();
    const textFieldRef = useRef<ValidatedInputRef>();
    const copyBtnRef = useRef();
    const [showCopyOverlay, setShowCopyOverlay] = useState<number>(0);
    const [autoClaim, setAutoClaim] = useState<boolean>(false);

    const [NFCScanning, setNFCScanning] = useState<LNNFCStartResult>(null);
    const [payingWithLNURL, setPayingWithLNURL] = useState<boolean>(false);

    const nfcScannerRef = useRef<LNNFCReader>(null);

    useEffect(() => {
        const nfcScanner = new LNNFCReader();
        if(!nfcScanner.isSupported()) return;
        nfcScanner.onScanned((lnurls: string[]) => {
            console.log("LNURL read: ", lnurls);

            if(lnurls[0]!=null) {
                props.swapper.getLNURLTypeAndData(lnurls[0]).then((result: LNURLPay | LNURLWithdraw) => {
                    if(result==null) return;
                    if(result.type!=="withdraw") return;
                    nfcScanner.stop();
                    props.quote.settleWithLNURLWithdraw(result as LNURLWithdraw).then(() => {
                        setPayingWithLNURL(true);
                    });
                });
            }
        });
        nfcScannerRef.current = nfcScanner;

        nfcScanner.start().then((res: LNNFCStartResult) => {
            setNFCScanning(res);
        });

        return () => {
            nfcScanner.stop();
        };
    }, []);

    useEffect(() => {

        const config = window.localStorage.getItem("crossLightning-autoClaim");

        setAutoClaim(config==null ? false : config==="true");

    }, []);

    const setAndSaveAutoClaim = (value: boolean) => {
        setAutoClaim(value);
        window.localStorage.setItem("crossLightning-autoClaim", ""+value);
    };

    const onCommit = async () => {
        setStarted(true);
        if(props.setAmountLock!=null) props.setAmountLock(true);
        props.quote.waitForPayment(abortControllerRef.current.signal, 2).catch(e => {
            if(abortControllerRef.current.signal.aborted) return;
            setError(e.toString());
            if(props.setAmountLock!=null) props.setAmountLock(false);
        });
    };

    const onClaim = async (skipChecks?: boolean) => {
        setLoading(true);
        try {
            await props.quote.commitAndClaim(null, skipChecks);
            setSuccess(true);
        } catch (e) {
            setSuccess(false);
            setError(e.toString());
        }
        setLoading(false);
    };

    useEffect(() => {
        if(showCopyOverlay===0) {
            return;
        }

        const timeout = setTimeout(() => {
            setShowCopyOverlay(0);
        }, 2000);

        return () => {
            clearTimeout(timeout);
        }
    }, [showCopyOverlay]);

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

    useEffect(() => {
        if(state===FromBTCLNSwapState.PR_PAID) {
            if(autoClaim) onClaim(true);
        }
    }, [state, autoClaim]);

    useEffect(() => {
        if(isStarted) {
            // @ts-ignore
            window.scrollBy(0,99999);
        }
    }, [isStarted]);

    const copy = (num: number) => {
        try {
            // @ts-ignore
            navigator.clipboard.writeText(props.quote.getAddress());
        } catch (e) {
            console.error(e);
        }

        try {
            // @ts-ignore
            textFieldRef.current.input.current.select();
            // @ts-ignore
            document.execCommand('copy');
            // @ts-ignore
            textFieldRef.current.input.current.blur();
        } catch (e) {
            console.error(e);
        }

        setShowCopyOverlay(num);
    };

    return (
        <>
            {error!=null ? (
                <Alert variant="danger" className="mb-3">
                    <strong>Swap failed</strong>
                    <label>{error}</label>
                </Alert>
            ) : ""}

            <Alert className="text-center mb-3 d-flex align-items-center flex-column" show={props.notEnoughForGas} variant="danger" closeVariant="white">
                <strong>Not enough SOL for fees</strong>
                <label>You need at least 0.005 SOL to pay for fees and refundable deposit! You can swap for gas first & then continue swapping here!</label>
                <Button className="mt-2" variant="secondary" onClick={() => {
                    navigate("/gas", {
                        state: {
                            returnPath: location.pathname+location.search
                        }
                    });
                }}>Swap for gas</Button>
            </Alert>

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
                        <Button onClick={onCommit} disabled={loading || props.notEnoughForGas} size="lg">
                            {loading ? <Spinner animation="border" size="sm" className="mr-2"/> : ""}
                            Initiate swap
                        </Button>
                    )}
                </>
            ) : (
                <>
                    {quoteTimeRemaining===0 ? "" : (
                        <div className="tab-accent mb-3">
                            {payingWithLNURL ? (
                                <div className="d-flex flex-column align-items-center justify-content-center">
                                    <Spinner animation="border" />
                                    Paying via NFC card...
                                </div>
                            ) : (
                                <>
                                    <Overlay target={showCopyOverlay===1 ? copyBtnRef.current : (showCopyOverlay===2 ? qrCodeRef.current : null)} show={showCopyOverlay>0} placement="top">
                                        {(props) => (
                                            <Tooltip id="overlay-example" {...props}>
                                                Address copied to clipboard!
                                            </Tooltip>
                                        )}
                                    </Overlay>

                                    <div ref={qrCodeRef}>
                                        <QRCodeSVG
                                            value={props.quote.getQrData()}
                                            size={300}
                                            includeMargin={true}
                                            className="cursor-pointer"
                                            onClick={() => {
                                                copy(2);
                                            }}
                                            imageSettings={NFCScanning===LNNFCStartResult.OK ? {
                                                src: "/icons/contactless.png",
                                                excavate: true,
                                                height: 50,
                                                width: 50
                                            } : null}
                                        />
                                    </div>
                                    <label>Please initiate a payment to this lightning network invoice</label>
                                    <ValidatedInput
                                        type={"text"}
                                        value={props.quote.getAddress()}
                                        textEnd={(
                                            <a href="javascript:void(0);" ref={copyBtnRef} onClick={() => {
                                                copy(1);
                                            }}>
                                                <Icon icon={clipboard}/>
                                            </a>
                                        )}
                                        inputRef={textFieldRef}
                                    />
                                </>
                            )}

                            <Form className="text-start d-flex align-items-center justify-content-center font-bigger mt-3">
                                <Form.Check // prettier-ignore
                                    id="autoclaim"
                                    type="switch"
                                    onChange={(val) => setAndSaveAutoClaim(val.target.checked)}
                                    checked={autoClaim}
                                />
                                <label title="" htmlFor="autoclaim" className="form-check-label me-2">Auto-claim</label>
                                <OverlayTrigger overlay={<Tooltip id="autoclaim-pay-tooltip">
                                    Automatically requests authorization of the claim transaction through your wallet as soon as the lightning payment arrives.
                                </Tooltip>}>
                                    <Badge bg="primary" className="pill-round" pill>?</Badge>
                                </OverlayTrigger>
                            </Form>
                        </div>
                    )}

                    {payingWithLNURL && quoteTimeRemaining!==0 ? "" : (
                        <div className="d-flex flex-column mb-3 tab-accent">
                            {quoteTimeRemaining===0 ? (
                                <label>Quote expired!</label>
                            ) : (
                                <label>Quote expires in {quoteTimeRemaining} seconds</label>
                            )}
                            <ProgressBar animated now={quoteTimeRemaining} max={initialQuoteTimeout} min={0}/>
                        </div>
                    )}

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
                        <Button onClick={() => onClaim()} disabled={loading} size="lg">
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
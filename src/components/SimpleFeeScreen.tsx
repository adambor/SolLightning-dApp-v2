import {
    FromBTCLNSwap,
    FromBTCSwap,
    ISwap,
    IToBTCSwap,SwapContract,
    Swapper,
    ToBTCSwap
} from "sollightning-sdk";
import {
    bitcoinCurrencies, CurrencySpec,
    getCurrencySpec,
    getNativeCurrency, toHumanReadable,
    toHumanReadableString
} from "../utils/Currencies";
import * as BN from "bn.js";
import {BitcoinWalletContext} from "./context/BitcoinWalletContext";
import {useContext, useEffect, useState} from "react";
import {Accordion, Badge, OverlayTrigger, Placeholder, Spinner, Tooltip} from "react-bootstrap";
import {getFeePct} from "../utils/Utils";
import * as React from "react";
import Icon from "react-icons-kit";
import {ic_receipt_outline} from 'react-icons-kit/md/ic_receipt_outline';
import {FEConstants} from "../FEConstants";

function FeePart(props: {
    bold?: boolean,
    text: string,
    currency1: CurrencySpec,
    amount1: BN,
    currency2?: CurrencySpec,
    amount2?: BN,
    usdValue?: number,
    className?: string,

    feePPM?: BN,
    feeBase?: BN,
    feeCurrency?: CurrencySpec,
    description?: string
}) {

    return (
        <div className={"d-flex font-medium " + props.className}>
            <small className={"d-flex align-items-center" + (props.bold ? " fw-bold" : "")}>
                {props.text}
                {props.feePPM == null ? "" : props.feeBase == null ? (
                    <Badge bg="primary" className="ms-1 pill-round px-2"
                           pill>{props.feePPM.toNumber() / 10000} %</Badge>
                ) : (
                    <OverlayTrigger overlay={<Tooltip id={"fee-tooltip-" + props.text}>
                        <span>{props.feePPM.toNumber() / 10000}% + {toHumanReadableString(props.feeBase, props.feeCurrency)} {props.feeCurrency.ticker}</span>
                    </Tooltip>}>
                        <Badge bg="primary" className="ms-1 pill-round px-2" pill>
                            <span className="dottedUnderline">{props.feePPM.toNumber() / 10000}%</span>
                        </Badge>
                    </OverlayTrigger>
                )}
                {props.description != null ? (
                    <OverlayTrigger overlay={<Tooltip id={"fee-tooltip-desc-" + props.text}>
                        <span>{props.description}</span>
                    </Tooltip>}>
                        <Badge bg="primary" className="ms-1 pill-round px-2" pill>
                            <span className="dottedUnderline">?</span>
                        </Badge>
                    </OverlayTrigger>
                ) : ""}
            </small>
            <span className="ms-auto fw-bold d-flex align-items-center">
                <OverlayTrigger placement="left" overlay={
                    <Tooltip id={"fee-tooltip-" + props.text} className="font-default">
                        {props.currency2==null ? (
                            <span className="ms-auto d-flex align-items-center">
                                <img src={props.currency1.icon} className="currency-icon-small" style={{marginTop: "-2px"}}/>
                                <span>{toHumanReadableString(props.amount1, props.currency1)} {props.currency1.ticker}</span>
                            </span>
                        ) : (
                            <span className="ms-auto text-end">
                                <span className="d-flex align-items-center justify-content-start">
                                    <img src={props.currency1.icon} className="currency-icon-small" style={{marginTop: "-1px"}}/>
                                    <span>{toHumanReadableString(props.amount1, props.currency1)} {props.currency1.ticker}</span>
                                </span>
                                <span className="d-flex align-items-center justify-content-start">
                                    <img src={props.currency2.icon} className="currency-icon-small"/>
                                    <span>{toHumanReadableString(props.amount2, props.currency2)} {props.currency2.ticker}</span>
                                </span>
                            </span>
                        )}
                    </Tooltip>
                }>
                    <span className="text-decoration-dotted font-monospace">${(props.usdValue==null ? 0 : props.usdValue).toFixed(2)}</span>
                </OverlayTrigger>
            </span>
        </div>
    );
}

type SingleFee = {
    text: string,
    currency1: CurrencySpec,
    amount1: BN,
    usdValue?: number,
    currency2?: CurrencySpec,
    amount2?: BN,
    className?: string,

    feePPM?: BN,
    feeBase?: BN,
    feeCurrency?: CurrencySpec,
    description?: string
}

function FeeSummary(props: {
    srcCurrency: CurrencySpec,
    srcAmount: BN,
    dstCurrency: CurrencySpec,
    dstAmount: BN,
    feeBreakdown: SingleFee[],
    loading?: boolean
}) {
    const totalUsdFee = props.feeBreakdown==null ? 0 : props.feeBreakdown.reduce((value, e) => e.usdValue==null ? value : value+parseFloat(e.usdValue.toFixed(2)), 0);

    const src = toHumanReadable(props.srcAmount, props.srcCurrency);
    const dst = toHumanReadable(props.dstAmount, props.dstCurrency);
    const price = src.div(dst);

    return (
        <Accordion>
            <Accordion.Item eventKey="0" className="tab-accent-nop">
                <Accordion.Header className="font-bigger d-flex flex-row" bsPrefix="fee-accordion-header">
                    <span className="me-auto">1 {props.dstCurrency.ticker} = {price.toFixed(props.srcCurrency.decimals)} {props.srcCurrency.ticker}</span>
                    <Icon className="d-flex me-1" size={16} icon={ic_receipt_outline}/>
                    <span className="me-2">{props.loading ? (
                        <Spinner animation="border" size="sm" />
                    ) : "$" + totalUsdFee.toFixed(2)}</span>
                </Accordion.Header>
                <Accordion.Body className="p-2">
                    {props.feeBreakdown.map((e, index) => {
                        return (
                            <FeePart
                                key={index}
                                className={e.className}
                                usdValue={e.usdValue}
                                text={e.text}
                                description={e.description}
                                currency1={e.currency1}
                                currency2={e.currency2}
                                amount1={e.amount1}
                                amount2={e.amount2}
                                feePPM={e.feePPM}
                                feeBase={e.feeBase}
                                feeCurrency={e.feeCurrency}
                            />
                        )
                    })}
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );

}

export function SimpleFeeSummaryScreen(props: {
    swapper: Swapper<any, any, SwapContract<any, any, any, any>, any>,
    swap: ISwap,
    btcFeeRate?: number,
    className?: string
}) {
    const {bitcoinWallet} = useContext(BitcoinWalletContext);

    const [btcTxFee, setBtcTxFee] = useState<SingleFee>();
    const [_btcTxFeeLoading, setBtcTxFeeLoading] = useState<boolean>(false);
    const btcTxFeeLoading = bitcoinWallet!=null && props.btcFeeRate!=null && props.btcFeeRate!=0 && props.swap!=null && props.swap instanceof FromBTCSwap && _btcTxFeeLoading;
    useEffect(() => {
        if(props.swapper==null) return;
        setBtcTxFee(null);
        if(bitcoinWallet==null || props.btcFeeRate==null || props.btcFeeRate==0 || props.swap==null || !(props.swap instanceof FromBTCSwap)) return;
        const swap = props.swap as FromBTCSwap<any>;
        setBtcTxFeeLoading(true);
        let cancelled = false;
        (async() => {
            try {
                const [usdcPrice, btcTxFee] = await Promise.all([
                    props.swapper.clientSwapContract.swapPrice.preFetchPrice(FEConstants.usdcToken),
                    bitcoinWallet.getTransactionFee(swap.address, props.swap.getInAmount(), props.btcFeeRate)
                ]);
                if(btcTxFee==null) {
                    if(cancelled) return;
                    setBtcTxFeeLoading(false);
                    return;
                }
                const btcTxFeeBN = new BN(btcTxFee);
                const usdcNetworkFee = await props.swapper.clientSwapContract.swapPrice.getFromBtcSwapAmount(btcTxFeeBN, FEConstants.usdcToken, null, usdcPrice);
                if(cancelled) return;
                setBtcTxFee({
                    text: "Network fee",
                    description: "Bitcoin transaction fee paid to bitcoin miners (this is a fee on top of your specified input amount)",
                    currency1: bitcoinCurrencies[0],
                    amount1: btcTxFeeBN,
                    usdValue: toHumanReadable(usdcNetworkFee, FEConstants.usdcToken).toNumber()
                });
                setBtcTxFeeLoading(false);
            } catch (e) {
                if(cancelled) return;
                console.error(e);
                setBtcTxFeeLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        }
    }, [bitcoinWallet, props.btcFeeRate, props.swap, props.swapper]);

    const [scSideFees, setScSideFees] = useState<SingleFee[]>();
    useEffect(() => {
        if(props.swapper==null) return;
        setScSideFees(null);
        if(props.swap instanceof IToBTCSwap) {
            const swap = props.swap as IToBTCSwap<any>;

            const currency = getCurrencySpec(swap.getToken());
            const btcCurrency = bitcoinCurrencies[swap instanceof ToBTCSwap ? 0 : 1];

            const swapFee = swap.getSwapFee();
            const swapBtcFee = swapFee.mul(swap.getOutAmount()).div(swap.getInAmountWithoutFee());

            const networkFee = swap.getNetworkFee();
            const networkBtcFee = networkFee.mul(swap.getOutAmount()).div(swap.getInAmountWithoutFee());

            //Swap fee, Network fee
            props.swapper.clientSwapContract.swapPrice.preFetchPrice(FEConstants.usdcToken).then(price => {
                return Promise.all([
                    props.swapper.clientSwapContract.swapPrice.getFromBtcSwapAmount(swapBtcFee, FEConstants.usdcToken, null, price),
                    props.swapper.clientSwapContract.swapPrice.getFromBtcSwapAmount(networkBtcFee, FEConstants.usdcToken, null, price)
                ])
            }).then(([swapFeeUsdc, networkFeeUsdc]) => {
                setScSideFees([
                    {
                        text: "Swap fee",
                        feePPM: getFeePct(props.swap, 1),
                        feeBase: props.swap.pricingInfo.satsBaseFee,
                        feeCurrency: btcCurrency,
                        currency1: currency,
                        amount1: swapFee,
                        // currency2: btcCurrency,
                        // amount2: swapBtcFee,
                        usdValue: toHumanReadable(swapFeeUsdc, FEConstants.usdcToken).toNumber()
                    },
                    {
                        text: "Network fee",
                        description: props.swap instanceof ToBTCSwap ?
                            "Bitcoin transaction fee paid to bitcoin miners" :
                            "Lightning network fee paid for routing the payment through the network",
                        currency1: currency,
                        amount1: networkFee,
                        // currency2: btcCurrency,
                        // amount2: networkBtcFee,
                        usdValue: toHumanReadable(networkFeeUsdc, FEConstants.usdcToken).toNumber()
                    }
                ])
            });
        }
        if(props.swap instanceof FromBTCSwap) {
            //Swap fee, Watchtower fee
            const swap = props.swap as FromBTCSwap<any>;

            const currency = getCurrencySpec(swap.getToken());
            const btcCurrency = bitcoinCurrencies[0];
            const fee = swap.getFee();
            const btcFee = fee.mul(swap.getInAmount()).div(swap.getOutAmountWithoutFee());

            Promise.all([
                props.swapper.clientSwapContract.swapPrice.preFetchPrice(FEConstants.usdcToken),
                props.swapper.clientSwapContract.swapPrice.getToBtcSwapAmount(swap.getClaimerBounty(), props.swapper.swapContract.getNativeCurrencyAddress())
            ]).then(([usdcPrice, claimerBountyInBtc]) => {
                return Promise.all([
                    props.swapper.clientSwapContract.swapPrice.getFromBtcSwapAmount(btcFee, FEConstants.usdcToken, null, usdcPrice),
                    props.swapper.clientSwapContract.swapPrice.getFromBtcSwapAmount(claimerBountyInBtc, FEConstants.usdcToken, null, usdcPrice)
                ])
            }).then(([swapFeeUsdc, claimerBountyUsdc]) => {
                setScSideFees([
                    {
                        text: "Swap fee",
                        feePPM: getFeePct(props.swap, 1),
                        feeBase: swap.pricingInfo.satsBaseFee,
                        feeCurrency: btcCurrency,
                        currency1: btcCurrency,
                        amount1: btcFee,
                        // currency2: currency,
                        // amount2: fee,
                        usdValue: toHumanReadable(swapFeeUsdc, FEConstants.usdcToken).toNumber()
                    },
                    {
                        text: "Watchtower fee",
                        description: "Fee paid to swap watchtowers which automatically claim the swap for you as soon as the bitcoin transaction confirms.",
                        currency1: getNativeCurrency(),
                        amount1: swap.getClaimerBounty(),
                        usdValue: toHumanReadable(claimerBountyUsdc, FEConstants.usdcToken).toNumber()
                    }
                ])
            });
        }
        if(props.swap instanceof FromBTCLNSwap) {
            const swap = props.swap as FromBTCLNSwap<any>;
            const fee = props.swap.getFee();
            const btcFee = fee.mul(props.swap.getInAmount()).div(props.swap.getOutAmountWithoutFee());
            const btcCurrency = bitcoinCurrencies[1];

            const currency = getCurrencySpec(props.swap.getToken());

            props.swapper.clientSwapContract.swapPrice.getFromBtcSwapAmount(btcFee, FEConstants.usdcToken).then((swapFeeUsdc) => {
                setScSideFees([
                    {
                        text: "Swap fee",
                        feePPM: getFeePct(props.swap, 1),
                        feeBase: props.swap.pricingInfo.satsBaseFee,
                        feeCurrency: btcCurrency,
                        currency1: btcCurrency,
                        amount1: btcFee,
                        // currency2: currency,
                        // amount2: fee,
                        usdValue: toHumanReadable(swapFeeUsdc, FEConstants.usdcToken).toNumber()
                    }
                ])
            });
        }
    }, [props.swap, props.swapper]);

    let className: string;

    if(props.className==null) {
        className = "tab-accent";
    } else {
        className = props.className+" tab-accent";
    }

    if(props.swap instanceof IToBTCSwap) {
        const currency = getCurrencySpec(props.swap.getToken());
        const btcCurrency = bitcoinCurrencies[props.swap instanceof ToBTCSwap ? 0 : 1];

        return (<FeeSummary
            srcCurrency={currency}
            srcAmount={props.swap.getInAmountWithoutFee()}
            dstCurrency={btcCurrency}
            dstAmount={props.swap.getOutAmount()}
            feeBreakdown={scSideFees || []}
            loading={scSideFees==null || btcTxFeeLoading}
        />);

    }
    if(props.swap instanceof FromBTCSwap) {
        const currency = getCurrencySpec(props.swap.getToken());
        const btcCurrency = bitcoinCurrencies[0];

        return (<FeeSummary
            srcCurrency={btcCurrency}
            srcAmount={props.swap.getInAmount()}
            dstCurrency={currency}
            dstAmount={props.swap.getOutAmountWithoutFee()}
            feeBreakdown={(btcTxFee==null ? [] : [btcTxFee]).concat(scSideFees || [])}
            loading={scSideFees==null || btcTxFeeLoading}
        />);
    }
    if(props.swap instanceof FromBTCLNSwap) {
        const btcCurrency = bitcoinCurrencies[1];

        const currency = getCurrencySpec(props.swap.getToken());

        return (<FeeSummary
            srcCurrency={btcCurrency}
            srcAmount={props.swap.getInAmount()}
            dstCurrency={currency}
            dstAmount={props.swap.getOutAmountWithoutFee()}
            feeBreakdown={scSideFees || []}
            loading={scSideFees==null || btcTxFeeLoading}
        />);
    }

    return null;
}
import {FromBTCLNSwap, FromBTCSwap, ISwap, IToBTCSwap, ToBTCLNSwap, ToBTCSwap} from "sollightning-sdk";
import {
    bitcoinCurrencies, CurrencySpec,
    getCurrencySpec,
    getNativeCurrency,
    toHumanReadableString
} from "../utils/Currencies";
import * as BN from "bn.js";
import {BitcoinWalletContext} from "./context/BitcoinWalletContext";
import {useContext, useEffect, useState} from "react";
import {Badge, OverlayTrigger, Tooltip} from "react-bootstrap";
import {getFeePct} from "../utils/Utils";
import * as React from "react";

function FeePart(props: {
    bold?: boolean,
    text: string,
    currency1: CurrencySpec,
    amount1: BN,
    currency2?: CurrencySpec,
    amount2?: BN,
    className?: string,

    feePPM?: BN,
    feeBase?: BN,
    feeCurrency?: CurrencySpec,
    description?: string
}) {

    return (
        <div className={"d-flex font-medium "+props.className}>
            <span className={"d-flex align-items-center"+(props.bold ? " fw-bold" : "")}>
                {props.text}
                {props.feePPM==null ? "" : props.feeBase==null ? (
                    <Badge bg="primary" className="ms-1 pill-round px-2" pill>{props.feePPM.toNumber()/10000} %</Badge>
                ) : (
                    <OverlayTrigger overlay={<Tooltip id={"fee-tooltip-"+props.text}>
                        <span>{props.feePPM.toNumber()/10000}% + {toHumanReadableString(props.feeBase, props.feeCurrency)} {props.feeCurrency.ticker}</span>
                    </Tooltip>}>
                        <Badge bg="primary" className="ms-1 pill-round px-2" pill>
                            <span className="dottedUnderline">{props.feePPM.toNumber()/10000}%</span>
                        </Badge>
                    </OverlayTrigger>
                )}
                {props.description!=null ? (
                    <OverlayTrigger overlay={<Tooltip id={"fee-tooltip-desc-"+props.text}>
                        <span>{props.description}</span>
                    </Tooltip>}>
                        <Badge bg="primary" className="ms-1 pill-round px-2" pill>
                            <span className="dottedUnderline">?</span>
                        </Badge>
                    </OverlayTrigger>
                ) : ""}
            </span>
            {props.currency2==null ? (
                <span className="ms-auto fw-bold d-flex align-items-center">
                    <img src={props.currency1.icon} className="currency-icon-small" style={{marginTop: "-2px"}}/>
                    <span>{toHumanReadableString(props.amount1, props.currency1)}</span>
                </span>
            ) : (
                <span className="ms-auto text-end">
                <span className="fw-bold d-flex mb--6 align-items-center justify-content-end">
                    <img src={props.currency1.icon} className="currency-icon-small"  style={{marginTop: "-1px"}}/>
                    <span>{toHumanReadableString(props.amount1, props.currency1)}</span>
                </span>
                <span className="d-flex align-items-center justify-content-end">
                    <img src={props.currency2.icon} className="currency-icon-small"/>
                    <small style={{marginTop: "2px"}}>{toHumanReadableString(props.amount2, props.currency2)}</small>
                </span>
            </span>
            )}
        </div>
    );
}

export function SimpleFeeSummaryScreen(props: {
    swap: ISwap,
    btcFeeRate?: number,
    className?: string
}) {
    const {bitcoinWallet} = useContext(BitcoinWalletContext);

    const [btcTxFee, setBtcTxFee] = useState<BN>();
    const [btcTxFeeLoading, setBtcTxFeeLoading] = useState<boolean>(false);
    useEffect(() => {
        setBtcTxFee(null);
        if(bitcoinWallet==null || props.btcFeeRate==null || props.btcFeeRate==0 || props.swap==null || !(props.swap instanceof FromBTCSwap)) return;
        setBtcTxFeeLoading(true);
        let cancelled = false;
        bitcoinWallet.getTransactionFee(props.swap.address, props.swap.getInAmount(), props.btcFeeRate).then(txFee => {
            if(cancelled) return;
            if(txFee!=null) setBtcTxFee(new BN(txFee));
            setBtcTxFeeLoading(false);
        }).catch((e) => {
            if(cancelled) return;
            console.error(e);
            setBtcTxFeeLoading(false);
        });
        return () => {
            cancelled = true;
        }
    }, [bitcoinWallet, props.btcFeeRate, props.swap]);

    let className: string;

    if(props.className==null) {
        className = "tab-accent";
    } else {
        className = props.className+" tab-accent";
    }

    if(props.swap instanceof IToBTCSwap) {
        const currency = getCurrencySpec(props.swap.getToken());
        const btcCurrency = bitcoinCurrencies[props.swap instanceof ToBTCSwap ? 0 : 1];

        const swapFee = props.swap.getSwapFee();
        const swapBtcFee = swapFee.mul(props.swap.getOutAmount()).div(props.swap.getInAmountWithoutFee());

        const networkFee = props.swap.getNetworkFee();
        const networkBtcFee = networkFee.mul(props.swap.getOutAmount()).div(props.swap.getInAmountWithoutFee());

        const fee = props.swap.getFee();
        const btcFee = swapBtcFee.add(networkBtcFee);

        return (<div className={className}>
            <FeePart
                className="border-bottom border-light" bold
                text={"Total fee"}
                currency1={currency} amount1={fee}
                currency2={btcCurrency} amount2={btcFee}/>
            <FeePart
                text={"Swap fee"}
                feePPM={getFeePct(props.swap, 1)} feeBase={props.swap.pricingInfo.satsBaseFee} feeCurrency={btcCurrency}
                currency1={currency} amount1={swapFee}
                currency2={btcCurrency} amount2={swapBtcFee}
            />
            <FeePart
                text={"Network fee"}
                currency1={currency} amount1={networkFee}
                currency2={btcCurrency} amount2={networkBtcFee}
                description={
                    props.swap instanceof ToBTCSwap ?
                        "Bitcoin transaction fee paid to bitcoin miners" :
                        "Lightning network fee paid for routing the payment through the network"
                }
            />
        </div>);
    }
    if(props.swap instanceof FromBTCSwap) {
        const currency = getCurrencySpec(props.swap.getToken());
        const btcCurrency = bitcoinCurrencies[0];
        const fee = props.swap.getFee();
        const btcFee = fee.mul(props.swap.getInAmount()).div(props.swap.getOutAmountWithoutFee());
        // const btcNetworkFeeInToken = btcTxFee!=null ? btcTxFee.mul(props.swap.getOutAmountWithoutFee()).div(props.swap.getInAmount()) : null;

        return (<div className={className}>
            {btcTxFee!=null ? (
                <FeePart
                    className="py-2"
                    text={"Network fee"}
                    currency1={bitcoinCurrencies[0]} amount1={btcTxFee}
                    description="Bitcoin transaction fee paid to bitcoin miners (this is a fee on top of your specified input amount)"
                />
            ) : ""}
            <FeePart
                className="border-bottom border-light pb-2"
                text={"Swap fee"}
                feePPM={getFeePct(props.swap, 1)} feeBase={props.swap.pricingInfo.satsBaseFee} feeCurrency={btcCurrency}
                currency1={btcCurrency} amount1={btcFee}
                currency2={currency} amount2={fee}
            />
            <FeePart
                className="py-2 mt-2"
                text={"Watchtower fee"}
                currency1={getNativeCurrency()} amount1={props.swap.getClaimerBounty()}
                description="Fee paid to swap watchtowers which automatically claim the swap for you as soon as the bitcoin transaction confirms."
            />
        </div>);
    }
    if(props.swap instanceof FromBTCLNSwap) {
        const fee = props.swap.getFee();
        const btcFee = fee.mul(props.swap.getInAmount()).div(props.swap.getOutAmountWithoutFee());
        const btcCurrency = bitcoinCurrencies[1];

        const currency = getCurrencySpec(props.swap.getToken());
        return (<div className={className}>
            <FeePart
                text={"Swap fee"}
                feePPM={getFeePct(props.swap, 1)} feeBase={props.swap.pricingInfo.satsBaseFee} feeCurrency={btcCurrency}
                currency1={btcCurrency} amount1={btcFee}
                currency2={currency} amount2={fee}
            />
        </div>);
    }

    return null;
}
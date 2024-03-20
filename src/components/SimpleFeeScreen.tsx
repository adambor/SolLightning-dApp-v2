import {FromBTCLNSwap, FromBTCSwap, ISwap, IToBTCSwap, ToBTCSwap} from "sollightning-sdk";
import {
    bitcoinCurrencies, CurrencySpec,
    getCurrencySpec,
    getNativeCurrency,
    toHumanReadable,
    toHumanReadableString
} from "../utils/Currencies";
import * as BN from "bn.js";
import {BitcoinWalletContext} from "./context/BitcoinWalletContext";
import {useContext, useEffect, useState} from "react";

export function FeePart(props: {
    bold?: boolean,
    text: string,
    currency1: CurrencySpec,
    amount1: BN,
    currency2: CurrencySpec,
    amount2: BN,
    className?: string
}) {
    return (
        <div className={"d-flex font-medium "+props.className}>
            <span className={"d-flex align-items-center"+(props.bold ? " fw-bold" : "")}>{props.text}</span>
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
            <FeePart className="border-bottom border-light" bold text={"Total fee:"} currency1={currency} amount1={fee} currency2={btcCurrency} amount2={btcFee}/>
            <FeePart text={"Swap fee:"} currency1={currency} amount1={swapFee} currency2={btcCurrency} amount2={swapBtcFee}/>
            <FeePart text={"Network fee:"} currency1={currency} amount1={networkFee} currency2={btcCurrency} amount2={networkBtcFee}/>
        </div>);
    }
    if(props.swap instanceof FromBTCSwap) {
        const currency = getCurrencySpec(props.swap.getToken());
        const fee = props.swap.getFee();
        const btcFee = fee.mul(props.swap.getInAmount()).div(props.swap.getOutAmountWithoutFee());
        const btcNetworkFeeInToken = btcTxFee!=null ? btcTxFee.mul(props.swap.getOutAmountWithoutFee()).div(props.swap.getInAmount()) : null;

        return (<div className={className}>
            {btcTxFee!=null ? (
                <FeePart text={"Network fee:"} currency1={bitcoinCurrencies[0]} amount1={btcTxFee} currency2={currency} amount2={btcNetworkFeeInToken}/>
            ) : ""}
            <FeePart className="border-bottom border-light pb-2" text={"Swap fee:"} currency1={bitcoinCurrencies[0]} amount1={btcFee} currency2={currency} amount2={fee}/>
            <div className="d-flex font-medium py-2 mt-2">
                <span>Watchtower fee:</span>
                <span className="ms-auto fw-bold d-flex align-items-center">
                    <img src={getNativeCurrency().icon} className="currency-icon-small" style={{marginTop: "-2px"}}/>
                    {toHumanReadableString(props.swap.getClaimerBounty(), getNativeCurrency())}
                </span>
            </div>
        </div>);
    }
    if(props.swap instanceof FromBTCLNSwap) {
        const fee = props.swap.getFee();
        const btcFee = fee.mul(props.swap.getInAmount()).div(props.swap.getOutAmountWithoutFee());

        const currency = getCurrencySpec(props.swap.getToken());
        return (<div className={className}>
            <FeePart text={"Swap fee:"} currency1={bitcoinCurrencies[1]} amount1={btcFee} currency2={currency} amount2={fee}/>
        </div>);
    }

    return null;
}
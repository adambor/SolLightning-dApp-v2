import {FromBTCLNSwap, FromBTCSwap, ISwap, IToBTCSwap, ToBTCSwap} from "sollightning-sdk";
import {
    bitcoinCurrencies, CurrencySpec,
    getCurrencySpec,
    getNativeCurrency,
    toHumanReadable,
    toHumanReadableString
} from "../utils/Currencies";
import * as BN from "bn.js";

function FeePart(props: {
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
                    <span className="fw-bold d-block mb--8">
                        <img src={props.currency1.icon} className="currency-icon-small"/>
                        <span>{toHumanReadableString(props.amount1, props.currency1)}</span>
                    </span>
                    <span className="d-block">
                        <img src={props.currency2.icon} className="currency-icon-small"/>
                        <small>{toHumanReadableString(props.amount2, props.currency2)}</small>
                    </span>
                </span>
        </div>
    );
}

export function SimpleFeeSummaryScreen(props: {
    swap: ISwap,
    className?: string
}) {

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
        const swapBtcFee = swapFee.mul(props.swap.getOutAmount()).div(props.swap.getInAmount());

        const networkFee = props.swap.getNetworkFee();
        const networkBtcFee = networkFee.mul(props.swap.getOutAmount()).div(props.swap.getInAmount());

        const fee = props.swap.getFee();
        const btcFee = swapBtcFee.add(networkBtcFee);

        return (<div className={className}>
            <FeePart className="border-bottom border-dark" bold text={"Total fee:"} currency1={currency} amount1={fee} currency2={btcCurrency} amount2={btcFee}/>
            <FeePart text={"Swap fee:"} currency1={currency} amount1={swapFee} currency2={btcCurrency} amount2={swapBtcFee}/>
            <FeePart text={"Network fee:"} currency1={currency} amount1={networkFee} currency2={btcCurrency} amount2={networkBtcFee}/>
        </div>);
    }
    if(props.swap instanceof FromBTCSwap) {
        const currency = getCurrencySpec(props.swap.getToken());
        const fee = props.swap.getFee();
        const btcFee = fee.mul(props.swap.getInAmount()).div(props.swap.getOutAmount());

        return (<div className={className}>
            <FeePart className="border-bottom border-secondary pb-2" text={"Swap fee:"} currency1={bitcoinCurrencies[0]} amount1={btcFee} currency2={currency} amount2={fee}/>
            <div className="d-flex font-medium py-2 mt-2">
                <span>Watchtower fee:</span>
                <span className="ms-auto fw-bold">
                    <img src={getNativeCurrency().icon} className="currency-icon-small"/>
                    {toHumanReadableString(props.swap.getClaimerBounty(), getNativeCurrency())}
                </span>
            </div>
        </div>);
    }
    if(props.swap instanceof FromBTCLNSwap) {
        const fee = props.swap.getFee();
        const btcFee = fee.mul(props.swap.getInAmount()).div(props.swap.getOutAmount());

        const currency = getCurrencySpec(props.swap.getToken());
        return (<div className={className}>
            <FeePart text={"Swap fee:"} currency1={bitcoinCurrencies[1]} amount1={btcFee} currency2={currency} amount2={fee}/>
        </div>);
    }

    return null;
}
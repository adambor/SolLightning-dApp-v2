import {FromBTCLNSwap, FromBTCSwap, ISwap, IToBTCSwap} from "sollightning-sdk";
import {getCurrencySpec, getNativeCurrency, toHumanReadable, toHumanReadableString} from "../utils/Currencies";


export function SimpleFeeSummaryScreen(props: {
    swap: ISwap,
    className?: string
}) {

    if(props.swap instanceof IToBTCSwap) {
        const currency = getCurrencySpec(props.swap.getToken());
        return (<div className={props.className}>
            <div className="d-flex fw-bold border-bottom border-light font-medium">
                <span>Total fee:</span>
                <span className="ms-auto">
                    <img src={currency.icon} className="currency-icon-small"/>
                    {toHumanReadableString(props.swap.getFee(), currency)} {currency.ticker}
                </span>
            </div>
            <div className="d-flex my-2">
                <span>Swap fee:</span>
                <span className="ms-auto">{toHumanReadableString(props.swap.getSwapFee(), currency)} {currency.ticker}</span>
            </div>
            <div className="d-flex my-2">
                <span>Network fee:</span>
                <span className="ms-auto">{toHumanReadableString(props.swap.getNetworkFee(), currency)} {currency.ticker}</span>
            </div>
        </div>);
    }
    if(props.swap instanceof FromBTCSwap) {
        const currency = getCurrencySpec(props.swap.getToken());
        return (<div className={props.className}>
            <div className="d-flex fw-bold font-medium">
                <span>Swap fee:</span>
                <span className="ms-auto">
                    <img src={currency.icon} className="currency-icon-small"/>
                    {toHumanReadableString(props.swap.getFee(), currency)} {currency.ticker}
                </span>
            </div>
            <div className="d-flex fw-bold font-medium">
                <span>Watchtower fee:</span>
                <span className="ms-auto">
                    <img src={getNativeCurrency().icon} className="currency-icon-small"/>
                    {toHumanReadableString(props.swap.getClaimerBounty(), getNativeCurrency())} {getNativeCurrency().ticker}
                </span>
            </div>
        </div>);
    }
    if(props.swap instanceof FromBTCLNSwap) {
        const currency = getCurrencySpec(props.swap.getToken());
        return (<div className={props.className}>
            <div className="d-flex fw-bold font-medium">
                <span>Swap fee:</span>
                <span className="ms-auto">
                    <img src={currency.icon} className="currency-icon-small"/>
                    {toHumanReadableString(props.swap.getFee(), currency)} {currency.ticker}
                </span>
            </div>
        </div>);
    }

    return null;
}
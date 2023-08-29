import {FromBTCLNSwap, FromBTCSwap, ISwap, IToBTCSwap} from "sollightning-sdk";
import {getCurrencySpec, getNativeCurrency, toHumanReadable, toHumanReadableString} from "../utils/Currencies";


export function FeeSummaryScreen(props: {
    swap: ISwap,
    className?: string
}) {

    if(props.swap instanceof IToBTCSwap) {
        const currency = getCurrencySpec(props.swap.getToken());
        return (<div className={props.className}>
            <div className="d-flex my-2">
                <span>Amount:</span>
                <span className="ms-auto">{toHumanReadableString(props.swap.getInAmountWithoutFee(), currency)} {currency.ticker}</span>
            </div>
            <div className="d-flex my-2">
                <span>Swap fee:</span>
                <span className="ms-auto">{toHumanReadableString(props.swap.getSwapFee(), currency)} {currency.ticker}</span>
            </div>
            <div className="d-flex my-2">
                <span>Network fee:</span>
                <span className="ms-auto">{toHumanReadableString(props.swap.getNetworkFee(), currency)} {currency.ticker}</span>
            </div>

            <div className="d-flex fw-bold border-top border-light font-bigger">
                <span>Total:</span>
                <span className="ms-auto">
                    <img src={currency.icon} className="currency-icon-small"/>
                    {toHumanReadableString(props.swap.getInAmount(), currency)} {currency.ticker}
                </span>
            </div>
        </div>);
    }
    if(props.swap instanceof FromBTCSwap) {
        const currency = getCurrencySpec(props.swap.getToken());
        return (<div className={props.className}>
            <div className="d-flex my-2">
                <span>Amount:</span>
                <span className="ms-auto">{toHumanReadableString(props.swap.getOutAmountWithoutFee(), currency)} {currency.ticker}</span>
            </div>
            <div className="d-flex my-2">
                <span>Swap fee:</span>
                <span className="ms-auto">{toHumanReadableString(props.swap.getFee(), currency)} {currency.ticker}</span>
            </div>
            <div className="d-flex my-2">
                <span>Watchtower fee:</span>
                <span className="ms-auto">{toHumanReadableString(props.swap.getClaimerBounty(), getNativeCurrency())} {getNativeCurrency().ticker}</span>
            </div>

            <div className="d-flex fw-bold border-top border-light font-bigger">
                <span>Total:</span>
                <span className="ms-auto">
                    <img src={currency.icon} className="currency-icon-small"/>
                    {toHumanReadableString(props.swap.getOutAmount(), currency)} {currency.ticker}
                </span>
            </div>
        </div>);
    }
    if(props.swap instanceof FromBTCLNSwap) {
        const currency = getCurrencySpec(props.swap.getToken());
        const isApproximate = props.swap.data.getAmount()==null;
        return (<div className={props.className}>
            <div className="d-flex my-2">
                <span>Amount:</span>
                <span className="ms-auto">{isApproximate? "~" : ""}{toHumanReadableString(props.swap.getOutAmountWithoutFee(), currency)} {currency.ticker}</span>
            </div>
            <div className="d-flex my-2">
                <span>Swap fee:</span>
                <span className="ms-auto">{toHumanReadableString(props.swap.getFee(), currency)} {currency.ticker}</span>
            </div>

            <div className="d-flex fw-bold border-top border-light font-bigger">
                <span>Total:</span>
                <span className="ms-auto">
                    <img src={currency.icon} className="currency-icon-small"/>
                    {isApproximate? "~" : ""}{toHumanReadableString(props.swap.getOutAmount(), currency)} {currency.ticker}
                </span>
            </div>
        </div>);
    }

    return (<div className={props.className}>
        <div className="d-flex my-2">
            <span>Amount:</span>
            <span className="ms-auto">0.02736 SOL</span>
        </div>
        <div className="d-flex my-2">
            <span>Swap fee:</span>
            <span className="ms-auto">0.00026 SOL</span>
        </div>
        <div className="d-flex my-2">
            <span>Network fee:</span>
            <span className="ms-auto">0.00036 SOL</span>
        </div>

        <div className="d-flex fw-bold">
            <span>Total:</span>
            <span className="ms-auto">0.02987 SOL</span>
        </div>

    </div>);
}
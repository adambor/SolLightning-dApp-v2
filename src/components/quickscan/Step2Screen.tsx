import ValidatedInput from "../ValidatedInput";
import {CurrencySpec} from "../SwapTab2";
import {CurrencyDropdown} from "../CurrencyDropdown";
import {useState} from "react";
import {FeeSummaryScreen} from "../FeeSummaryScreen";
import {Button} from "react-bootstrap";


const currencies: CurrencySpec[] = [
    {
        name: "Solana",
        ticker: "SOL",
        decimals: 9,
        icon: ""
    },
    {
        name: "USD Circle",
        ticker: "USDC",
        decimals: 6,
        icon: ""
    }
]

export function Step2Screen(props: {
    type: "send" | "receive"
}) {
    const [selectedCurrency, setSelectedCurrency] = useState<CurrencySpec>(null);

    return (
        <div>
            <p>{props.type==="send" ? "Pay" : "Receive"}</p>
            <ValidatedInput
                type={"number"}
                textEnd={"BTC"}
            />
            <p>with</p>
            <CurrencyDropdown currencyList={currencies} onSelect={setSelectedCurrency} value={selectedCurrency}/>
            <FeeSummaryScreen/>
            <Button size="lg">Pay</Button>
        </div>
    );
}
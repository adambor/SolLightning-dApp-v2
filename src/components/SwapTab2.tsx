import {Swapper, SwapType} from "sollightning-sdk";
import {Card, Dropdown} from "react-bootstrap";
import {useRef, useState} from "react";
import ValidatedInput, {ValidatedInputRef} from "./ValidatedInput";
import BigNumber from "bignumber.js";
import * as BN from "bn.js";
import {FEConstants} from "../FEConstants";
import * as React from "react";

const bitcoinCurrencies: CurrencySpec[] = [
    {
        name: "Bitcoin (on-chain)",
        ticker: "BTC",
        decimals: 8,
        icon: ""
    },
    {
        name: "Bitcoin (lightning)",
        ticker: "BTC-LN",
        decimals: 8,
        icon: ""
    }
]

export type CurrencySpec = {
    name: string,
    ticker: string,
    decimals: number,
    icon: string
}
function CurrencyDropdown(props: {
    currencyList: CurrencySpec[],
    onSelect: (currency: CurrencySpec) => void,
    value: CurrencySpec
}) {

    return (
        <Dropdown>
            <Dropdown.Toggle variant="success" id="dropdown-basic">
                <img className="currency-icon" src={props.value.icon}/>
                {props.value.ticker}
            </Dropdown.Toggle>

            <Dropdown.Menu>
                {props.currencyList.map(curr => {
                    return (
                        <Dropdown.Item onClick={() => {
                            props.onSelect(curr);
                        }}>
                            <img className="currency-icon" src={curr.icon}/>
                            {curr.ticker}
                        </Dropdown.Item>
                    )
                })}
            </Dropdown.Menu>
        </Dropdown>
    )

}

export function SwapTab(props: {
    swapper: Swapper<any, any, any, any>,
    supportedCurrencies: CurrencySpec[]
}) {

    const [inCurrency, setInCurrency] = useState<CurrencySpec>();
    const [inAmount, setInAmount] = useState<string>(null);
    const inAmountRef = useRef<ValidatedInputRef>();
    const [inDisabled, setInDisable] = useState<boolean>(false);


    return (
        <Card className="p-3">
            <Card>
                <ValidatedInput
                    disabled={inDisabled}
                    inputRef={inAmountRef}
                    className="mb-4 strip-group-text"
                    type="number"
                    value={inAmount}
                    size={"lg"}
                    onChange={(val) => {
                        setInAmount(val);
                    }}
                    step={new BigNumber("0.00000001")}
                    onValidate={(val: any) => {
                        return val==="" ? "Amount cannot be empty" : null;
                    }}
                />
                <CurrencyDropdown currencyList={bitcoinCurrencies} onSelect={setInCurrency} value={inCurrency} />
            </Card>
        </Card>
    )

}
import {Dropdown} from "react-bootstrap";
import * as React from "react";

export type CurrencySpec = {
    name: string,
    ticker: string,
    decimals: number,
    icon: string
}
export function CurrencyDropdown(props: {
    currencyList: CurrencySpec[],
    onSelect: (currency: CurrencySpec) => void,
    value: CurrencySpec
}) {

    return (
        <Dropdown>
            <Dropdown.Toggle variant="light" id="dropdown-basic">
                <img className="currency-icon" src={props.value?.icon}/>
                {props.value==null ? "None" : props.value.ticker}
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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, Dropdown } from "react-bootstrap";
import { useRef, useState } from "react";
import ValidatedInput from "./ValidatedInput";
import BigNumber from "bignumber.js";
const bitcoinCurrencies = [
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
];
function CurrencyDropdown(props) {
    return (_jsxs(Dropdown, { children: [_jsxs(Dropdown.Toggle, Object.assign({ variant: "success", id: "dropdown-basic" }, { children: [_jsx("img", { className: "currency-icon", src: props.value.icon }), props.value.ticker] })), _jsx(Dropdown.Menu, { children: props.currencyList.map(curr => {
                    return (_jsxs(Dropdown.Item, Object.assign({ onClick: () => {
                            props.onSelect(curr);
                        } }, { children: [_jsx("img", { className: "currency-icon", src: curr.icon }), curr.ticker] })));
                }) })] }));
}
export function SwapTab(props) {
    const [inCurrency, setInCurrency] = useState();
    const [inAmount, setInAmount] = useState(null);
    const inAmountRef = useRef();
    const [inDisabled, setInDisable] = useState(false);
    return (_jsx(Card, Object.assign({ className: "p-3" }, { children: _jsxs(Card, { children: [_jsx(ValidatedInput, { disabled: inDisabled, inputRef: inAmountRef, className: "mb-4 strip-group-text", type: "number", value: inAmount, size: "lg", onChange: (val) => {
                        setInAmount(val);
                    }, step: new BigNumber("0.00000001"), onValidate: (val) => {
                        return val === "" ? "Amount cannot be empty" : null;
                    } }), _jsx(CurrencyDropdown, { currencyList: bitcoinCurrencies, onSelect: setInCurrency, value: inCurrency })] }) })));
}

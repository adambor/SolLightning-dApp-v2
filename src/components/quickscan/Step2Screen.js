import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import ValidatedInput from "../ValidatedInput";
import { CurrencyDropdown } from "../CurrencyDropdown";
import { useState } from "react";
import { FeeSummaryScreen } from "../FeeSummaryScreen";
import { Button } from "react-bootstrap";
const currencies = [
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
];
export function Step2Screen(props) {
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    return (_jsxs("div", { children: [_jsx("p", { children: props.type === "send" ? "Pay" : "Receive" }), _jsx(ValidatedInput, { type: "number", textEnd: "BTC" }), _jsx("p", { children: "with" }), _jsx(CurrencyDropdown, { currencyList: currencies, onSelect: setSelectedCurrency, value: selectedCurrency }), _jsx(FeeSummaryScreen, {}), _jsx(Button, Object.assign({ size: "lg" }, { children: "Pay" }))] }));
}

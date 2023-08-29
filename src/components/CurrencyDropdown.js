import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dropdown } from "react-bootstrap";
export function CurrencyDropdown(props) {
    return (_jsxs(Dropdown, { children: [_jsxs(Dropdown.Toggle, Object.assign({ variant: "light", id: "dropdown-basic", size: "lg" }, { children: [props.value == null ? "" : _jsx("img", { className: "currency-icon", src: props.value.icon }), props.value == null ? "Select currency" : props.value.ticker] })), _jsx(Dropdown.Menu, { children: props.currencyList.map(curr => {
                    return (_jsxs(Dropdown.Item, Object.assign({ onClick: () => {
                            props.onSelect(curr);
                        } }, { children: [_jsx("img", { className: "currency-icon", src: curr.icon }), curr.ticker] })));
                }) })] }));
}

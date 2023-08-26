import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dropdown } from "react-bootstrap";
export function CurrencyDropdown(props) {
    var _a;
    return (_jsxs(Dropdown, { children: [_jsxs(Dropdown.Toggle, Object.assign({ variant: "light", id: "dropdown-basic" }, { children: [_jsx("img", { className: "currency-icon", src: (_a = props.value) === null || _a === void 0 ? void 0 : _a.icon }), props.value == null ? "None" : props.value.ticker] })), _jsx(Dropdown.Menu, { children: props.currencyList.map(curr => {
                    return (_jsxs(Dropdown.Item, Object.assign({ onClick: () => {
                            props.onSelect(curr);
                        } }, { children: [_jsx("img", { className: "currency-icon", src: curr.icon }), curr.ticker] })));
                }) })] }));
}

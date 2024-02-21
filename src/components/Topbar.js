import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge, Button, ButtonGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { SwapsContext } from "./context/SwapsContext";
import { useContext } from "react";
const tabs = [
    {
        name: "Swap",
        path: "/"
    },
    {
        name: "Scan",
        path: "/scan"
    },
    {
        name: "Pending",
        path: "/history"
    },
    {
        name: "Gas",
        path: "/gas"
    }
];
export function Topbar(props) {
    const navigate = useNavigate();
    const context = useContext(SwapsContext);
    return (_jsx("div", Object.assign({ className: "mt-3 pb-2 z-1" }, { children: _jsx(ButtonGroup, Object.assign({ className: "bg-dark bg-opacity-25" }, { children: tabs.map((val, index) => {
                if (index === 2 && context.actionableSwaps.length === 0)
                    return;
                if (index === 3 && props.selected !== index)
                    return;
                return (_jsxs(Button, Object.assign({ onClick: () => {
                        if (props.selected !== index && props.enabled)
                            navigate(val.path);
                    }, variant: index === props.selected ? "light" : "outline-light", disabled: !props.enabled }, { children: [val.name, index === 2 ? (_jsx(Badge, Object.assign({ className: "ms-2", bg: "danger", pill: true }, { children: context.actionableSwaps.length }))) : ""] })));
            }) })) })));
}

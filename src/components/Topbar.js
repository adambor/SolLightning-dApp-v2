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
    }
];
export function Topbar(props) {
    const navigate = useNavigate();
    const context = useContext(SwapsContext);
    return (_jsx("div", Object.assign({ className: "bg-dark pb-2" }, { children: _jsx(ButtonGroup, Object.assign({ className: "bg-light" }, { children: tabs.map((val, index) => {
                if (index === 2 && context.actionableSwaps.length === 0)
                    return;
                return (_jsxs(Button, Object.assign({ onClick: () => {
                        if (props.selected !== index && props.enabled)
                            navigate(val.path);
                    }, variant: index === props.selected ? "primary" : "outline-primary", disabled: !props.enabled }, { children: [val.name, index === 2 ? (_jsx(Badge, Object.assign({ className: "ms-2", bg: "danger", pill: true }, { children: context.actionableSwaps.length }))) : ""] })));
            }) })) })));
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { QRScanner } from "../qr/QRScanner";
import { Button } from "react-bootstrap";
export function QuickScanScreen() {
    return (_jsxs("div", Object.assign({ className: "d-flex flex-column flex-grow-1" }, { children: [_jsx("div", Object.assign({ className: "d-flex align-content-center justify-content-center flex-fill", style: {
                    maxWidth: "100vw",
                } }, { children: _jsx(QRScanner, { onResult: (result, err) => {
                    }, camera: "environment" }) })), _jsx("div", Object.assign({ className: "bg-dark p-3" }, { children: _jsx(Button, { children: "Paste address" }) }))] })));
}

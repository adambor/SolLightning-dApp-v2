import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { QRScanner } from "../qr/QRScanner";
import { Button } from "react-bootstrap";
export function QuickScanScreen(props) {
    return (_jsxs("div", Object.assign({ className: "d-flex flex-column flex-grow-1" }, { children: [_jsx("div", Object.assign({ className: "d-flex align-content-center justify-content-center flex-fill", style: {
                    position: "absolute",
                    top: "0px",
                    bottom: "0px",
                    right: "0px",
                    left: "0px",
                    zIndex: -1
                } }, { children: _jsx(QRScanner, { onResult: (result, err) => {
                        if (result != null)
                            props.onScanned(result);
                    }, camera: "environment" }) })), _jsx("div", Object.assign({ className: "bg-dark p-3 mt-auto" }, { children: _jsx(Button, { children: "Paste from clipboard" }) }))] })));
}

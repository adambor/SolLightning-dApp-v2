import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { QRScanner } from "../qr/QRScanner";
import { useNavigate } from "react-router-dom";
import { Topbar } from "../Topbar";
export function QuickScanScreen(props) {
    const navigate = useNavigate();
    return (_jsxs(_Fragment, { children: [_jsx(Topbar, { selected: 1, enabled: true }), _jsxs("div", Object.assign({ className: "d-flex flex-column flex-grow-1" }, { children: [_jsx("div", Object.assign({ className: "d-flex align-content-center justify-content-center flex-fill", style: {
                            position: "absolute",
                            top: "0px",
                            bottom: "0px",
                            right: "0px",
                            left: "0px",
                            zIndex: -1
                        } }, { children: _jsx(QRScanner, { onResult: (result, err) => {
                                if (result != null) {
                                    if (props.onScanned != null) {
                                        props.onScanned(result);
                                    }
                                    else {
                                        navigate("/scan/2?address=" + encodeURIComponent(result));
                                    }
                                }
                            }, camera: "environment" }) })), _jsx("div", { className: "bg-dark p-4 mt-auto" })] }))] }));
}

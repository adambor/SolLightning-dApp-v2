import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, CloseButton, ListGroup, Modal } from "react-bootstrap";
import { useContext, useEffect, useState } from "react";
import { BitcoinWalletContext } from "../context/BitcoinWalletContext";
import { getInstalledBitcoinWallets } from "./BitcoinWalletUtils";
export function BitcoinWalletButton(props) {
    const { bitcoinWallet, setBitcoinWallet } = useContext(BitcoinWalletContext);
    const [loading, setLoading] = useState(false);
    const [modalOpened, setModalOpened] = useState(false);
    const [usableWallets, setUsableWallets] = useState([]);
    useEffect(() => {
        if (bitcoinWallet != null)
            return;
        setLoading(true);
        getInstalledBitcoinWallets().then(wallets => {
            setUsableWallets(wallets);
            setLoading(false);
        }).catch(e => console.error(e));
    }, [bitcoinWallet == null]);
    const connectWallet = () => {
        if (usableWallets.length === 1) {
            usableWallets[0].use().then(result => {
                setBitcoinWallet(result);
            }).catch(e => console.error(e));
        }
        else {
            setModalOpened(true);
        }
    };
    if (usableWallets.length === 0 && bitcoinWallet == null)
        return _jsx(_Fragment, {});
    return (_jsxs(_Fragment, { children: [_jsxs(Modal, Object.assign({ contentClassName: "text-white bg-dark", size: "sm", centered: true, show: modalOpened, onHide: () => setModalOpened(false), dialogClassName: "min-width-400px" }, { children: [_jsx(Modal.Header, Object.assign({ className: "border-0" }, { children: _jsxs(Modal.Title, Object.assign({ id: "contained-modal-title-vcenter", className: "d-flex flex-grow-1" }, { children: ["Select a Bitcoin wallet", _jsx(CloseButton, { className: "ms-auto", variant: "white", onClick: () => setModalOpened(false) })] })) })), _jsx(Modal.Body, { children: _jsx(ListGroup, Object.assign({ variant: "flush" }, { children: usableWallets.map((e, index) => {
                                return (_jsxs(ListGroup.Item, Object.assign({ action: true, onClick: () => {
                                        e.use().then(result => {
                                            setBitcoinWallet(result);
                                            setModalOpened(false);
                                        }).catch(e => console.error(e));
                                    }, className: "d-flex flex-row bg-transparent text-white border-0" }, { children: [_jsx("img", { width: 20, height: 20, src: e.iconUrl, className: "me-2" }), _jsx("span", { children: e.name })] })));
                            }) })) })] })), bitcoinWallet == null ? (_jsx(Button, Object.assign({ variant: "dark", className: "me-2 px-3", onClick: connectWallet }, { children: "Connect BTC wallet" }))) : (_jsxs(Button, Object.assign({ variant: "dark", className: "me-2 px-3" }, { children: [_jsx("img", { width: 20, height: 20, src: bitcoinWallet.getIcon(), className: "me-2" }), bitcoinWallet.getName()] })))] }));
}

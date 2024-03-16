import {Button, CloseButton, Dropdown, ListGroup, Modal} from "react-bootstrap";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import * as React from "react";
import {BitcoinNetworkType, getAddress, getCapabilities} from "sats-connect";
import {useContext, useEffect, useState} from "react";
import {BitcoinWalletContext} from "../context/BitcoinWalletContext";
import {BitcoinWalletType, getInstalledBitcoinWallets} from "./BitcoinWalletUtils";
import {ic_brightness_1} from 'react-icons-kit/md/ic_brightness_1';
import Icon from "react-icons-kit";

export function useBitcoinWalletChooser() {

    const {bitcoinWallet, setBitcoinWallet} = useContext(BitcoinWalletContext);

    const [loading, setLoading] = useState<boolean>(false);
    const [modalOpened, setModalOpened] = useState<boolean>(false);
    const [usableWallets, setUsableWallets] = useState<BitcoinWalletType[]>([]);

    useEffect(() => {
        if(bitcoinWallet!=null) return;

        setLoading(true);
        getInstalledBitcoinWallets().then(wallets => {
            setUsableWallets(wallets);
            setLoading(false);
        }).catch(e => console.error(e));
    },[bitcoinWallet==null]);

    const connectWallet = (wallet?: BitcoinWalletType) => {
        if(wallet!=null) {
            wallet.use().then(result => {
                setBitcoinWallet(result);
                setModalOpened(false);
            }).catch(e => console.error(e));
            return;
        }
        if(usableWallets.length===1) {
            usableWallets[0].use().then(result => {
                setBitcoinWallet(result);
            }).catch(e => console.error(e));
        } else {
            setModalOpened(true);
        }
    };

    return {loading, modalOpened, setModalOpened, usableWallets, bitcoinWallet, connectWallet};
}

export function BitcoinWalletModal(props: {
    modalOpened: boolean,
    setModalOpened: (opened: boolean) => void,
    connectWallet: (wallet?: BitcoinWalletType) => void,
    usableWallets: BitcoinWalletType[]
}) {
    return (
        <Modal contentClassName="text-white bg-dark" size="sm" centered show={props.modalOpened} onHide={() => props.setModalOpened(false)} dialogClassName="min-width-400px">
            <Modal.Header className="border-0">
                <Modal.Title id="contained-modal-title-vcenter" className="d-flex flex-grow-1">
                    Select a Bitcoin wallet
                    <CloseButton className="ms-auto" variant="white" onClick={() => props.setModalOpened(false)}/>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <ListGroup variant="flush">
                    {props.usableWallets.map((e, index) => {
                        return (
                            <ListGroup.Item action onClick={() => props.connectWallet(e)} className="d-flex flex-row bg-transparent text-white border-0">
                                <img width={20} height={20} src={e.iconUrl} className="me-2"/>
                                <span>{e.name}</span>
                            </ListGroup.Item>
                        );
                    })}
                </ListGroup>
            </Modal.Body>
        </Modal>
    )
}

export function BitcoinWalletButton(props: {}) {

    const {loading, modalOpened, setModalOpened, usableWallets, bitcoinWallet, connectWallet} = useBitcoinWalletChooser();

    if(usableWallets.length===0 && bitcoinWallet==null) return <></>;

    return (
        <>
            <BitcoinWalletModal
                modalOpened={modalOpened}
                setModalOpened={setModalOpened}
                usableWallets={usableWallets}
                connectWallet={connectWallet}
            />

            {bitcoinWallet==null ? (
                <Button variant="dark" className={"me-2 px-3"} onClick={() => connectWallet()}>
                    Connect BTC wallet
                </Button>
            ) : (
                <Button variant="dark" className={"me-2 px-3"}>
                    <img width={20} height={20} src={bitcoinWallet.getIcon()} className="me-2"/>
                    {bitcoinWallet.getName()}
                </Button>
            )}
        </>
    );
}

export function BitcoinWalletAnchor(props: {className?: string}) {

    const {loading, modalOpened, setModalOpened, usableWallets, bitcoinWallet, connectWallet} = useBitcoinWalletChooser();

    if(usableWallets.length===0 && bitcoinWallet==null) return <></>;

    return (
        <>
            <BitcoinWalletModal
                modalOpened={modalOpened}
                setModalOpened={setModalOpened}
                usableWallets={usableWallets}
                connectWallet={connectWallet}
            />

            {bitcoinWallet==null ? (
                <a className={props.className} href="javascript:void(0);" onClick={() => connectWallet()}>
                    Connect BTC wallet
                </a>
            ) : (
                <div className={"d-flex flex-row align-items-center "+props.className}>
                    <Icon className="text-success d-flex align-items-center me-1" icon={ic_brightness_1} size={12}/>
                    <img width={16} height={16} src={bitcoinWallet.getIcon()} className="me-1"/>
                    {bitcoinWallet.getName()}
                </div>
            )}
        </>
    );
}
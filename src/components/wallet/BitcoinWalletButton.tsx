import {Button, CloseButton, Dropdown, ListGroup, Modal} from "react-bootstrap";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import * as React from "react";
import {BitcoinNetworkType, getAddress, getCapabilities} from "sats-connect";
import {useContext, useEffect, useState} from "react";
import {BitcoinWalletContext} from "../context/BitcoinWalletContext";
import {BitcoinWalletType, getInstalledBitcoinWallets} from "./BitcoinWalletUtils";


export function BitcoinWalletButton(props: {}) {

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

    const connectWallet = () => {
        if(usableWallets.length===1) {
            usableWallets[0].use().then(result => {
                setBitcoinWallet(result);
            }).catch(e => console.error(e));
        } else {
            setModalOpened(true);
        }
    };

    if(usableWallets.length===0 && bitcoinWallet==null) return <></>;

    return (
        <>
            <Modal contentClassName="text-white bg-dark" size="sm" centered show={modalOpened} onHide={() => setModalOpened(false)} dialogClassName="min-width-400px">
                <Modal.Header className="border-0">
                    <Modal.Title id="contained-modal-title-vcenter" className="d-flex flex-grow-1">
                        Select a Bitcoin wallet
                        <CloseButton className="ms-auto" variant="white" onClick={() => setModalOpened(false)}/>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ListGroup variant="flush">
                        {usableWallets.map((e, index) => {
                            return (
                                <ListGroup.Item action onClick={() => {
                                    e.use().then(result => {
                                        setBitcoinWallet(result);
                                        setModalOpened(false);
                                    }).catch(e => console.error(e));
                                }} className="d-flex flex-row bg-transparent text-white border-0">
                                    <img width={20} height={20} src={e.iconUrl} className="me-2"/>
                                    <span>{e.name}</span>
                                </ListGroup.Item>
                            );
                        })}
                    </ListGroup>
                </Modal.Body>
            </Modal>

            {bitcoinWallet==null ? (
                <Button variant="dark" className={"me-2 px-3"} onClick={connectWallet}>
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
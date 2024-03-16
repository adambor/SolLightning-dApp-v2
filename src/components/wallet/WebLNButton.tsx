import {Button, CloseButton, Dropdown, ListGroup, Modal} from "react-bootstrap";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import * as React from "react";
import {BitcoinNetworkType, getAddress, getCapabilities} from "sats-connect";
import {useContext, useEffect, useState} from "react";
import {BitcoinWalletContext} from "../context/BitcoinWalletContext";
import {BitcoinWalletType, getInstalledBitcoinWallets} from "./BitcoinWalletUtils";
import {ic_brightness_1} from 'react-icons-kit/md/ic_brightness_1';
import Icon from "react-icons-kit";
import {connectWebLN, isWebLNInstalled} from "./WebLNUtils";
import {WebLNContext} from "../context/WebLNContext";

export function useWebLNWalletChooser() {

    const {lnWallet, setLnWallet} = useContext(WebLNContext);

    const isInstalled = isWebLNInstalled();

    const connectWallet = () => {
        connectWebLN().then(res => {
            setLnWallet(res);
        }).catch(e => console.error(e));
    };

    return {isInstalled, lnWallet, connectWallet};
}

export function WebLNButton(props: {}) {

    const {isInstalled, lnWallet, connectWallet} = useWebLNWalletChooser();

    if(!isInstalled && lnWallet==null) return <></>;

    return (
        <>
            {lnWallet==null ? (
                <Button variant="dark" className={"me-2 px-3"} onClick={() => connectWallet()}>
                    Connect BTC-LN wallet
                </Button>
            ) : (
                <Button variant="dark" className={"me-2 px-3"}>
                    <img width={20} height={20} src="/wallets/WebLN.png" className="me-2"/>
                    WebLN
                </Button>
            )}
        </>
    );
}

export function WebLNAnchor(props: {className?: string}) {

    const {isInstalled, lnWallet, connectWallet} = useWebLNWalletChooser();

    if(!isInstalled && lnWallet==null) return <></>;

    return (
        <>
            {lnWallet==null ? (
                <a className={props.className} href="javascript:void(0);" onClick={() => connectWallet()}>
                    Connect BTC-LN wallet
                </a>
            ) : (
                <div className={"d-flex flex-row align-items-center "+props.className}>
                    <Icon className="text-success d-flex align-items-center me-1" icon={ic_brightness_1} size={12}/>
                    <img width={16} height={16} src="/wallets/WebLN.png" className="me-1"/>
                    WebLN
                </div>
            )}
        </>
    );
}
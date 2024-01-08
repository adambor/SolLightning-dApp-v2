import {Button} from "react-bootstrap";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import * as React from "react";
import {BitcoinNetworkType, getAddress, getCapabilities} from "sats-connect";
import {useEffect, useState} from "react";


export function BitcoinWalletButton(props: {}) {

    const [isInstalled, setIsInstalled] = useState<boolean>(false);
    const [isEnabled, setEnabled] = useState<boolean>(true);

    useEffect(() => {
        setEnabled(localStorage.getItem("crossLightning-btcwalletenable")!=="false");

        (async() => {
            let success;
            for(let i=0;i<10;i++) {
                try {
                    await getCapabilities({
                        onFinish(response) {
                            console.log("Capabilities: ", response);
                            setIsInstalled(true);
                        },
                        onCancel() {
                            console.log("User cancelled!");
                        },
                        payload: {
                            network: {
                                type: BitcoinNetworkType.Mainnet,
                            },
                        },
                    });
                    success = true;
                    break;
                } catch (e) {
                    success = false;
                    console.error(e);
                    await new Promise((resolve) => setTimeout(resolve, 200));
                }
            }
            if(!success) setIsInstalled(false);
        })();
    },[]);

    const connectWallet = () => {
        // if(btcConnectionState==null) {
        //     const getAddressOptions = {
        //         payload: {
        //             purposes: [AddressPurpose.Payment],
        //             message: 'Bitcoin address for SolLightning swaps',
        //             network: {
        //                 type: BitcoinNetworkType.Mainnet
        //             },
        //         },
        //         onFinish: (response) => {
        //             const address = response.addresses[0].address;
        //             const connectedWallet = {
        //                 address,
        //                 declined: false,
        //                 getBalance: () => ChainUtils.getAddressBalances(address).then(val => val.confirmedBalance.add(val.unconfirmedBalance)),
        //                 sendTransaction: (recipientAddress: string, amount: BN) => new Promise<void>((resolve, reject) => {
        //                     // @ts-ignore
        //                     const amt = BigInt(amount.toString(10))
        //                     const sendBtcOptions = {
        //                         payload: {
        //                             network: {
        //                                 type: BitcoinNetworkType.Mainnet,
        //                             },
        //                             recipients: [
        //                                 {
        //                                     address: recipientAddress,
        //                                     amountSats: amt,
        //                                 }
        //                             ],
        //                             senderAddress: address,
        //                         },
        //                         onFinish: (response) => resolve(),
        //                         onCancel: () => reject(new UserError("Bitcoin transaction rejected by the user!")),
        //                     };
        //
        //                     sendBtcTransaction(sendBtcOptions).catch(reject);
        //                 })
        //             };
        //             setBtcConnectionState(connectedWallet);
        //             console.log("Bitcoin wallet connected:", connectedWallet);
        //         },
        //         onCancel: () => {
        //             setBtcConnectionState({
        //                 address: null,
        //                 declined: true
        //             });
        //             console.log("Canceled getaddress request");
        //         },
        //     };
        //
        //     getAddress(getAddressOptions).catch(err => {
        //         console.error(err)
        //     });
        // }
    };

    console.log("Is installed: ", isInstalled);

    if(!isInstalled) return <></>;

    return (
        <Button variant="dark" className={"me-2 px-3 "+(isEnabled ? "" : "opacity-50")}>
            <img width={20} height={20} src="/icons/wallets/xverse.png"/>
        </Button>
    );

}
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { FromBTCLNSwap, FromBTCSwap, IToBTCSwap, ToBTCSwap } from "sollightning-sdk";
import { bitcoinCurrencies, getCurrencySpec, getNativeCurrency, toHumanReadable, toHumanReadableString } from "../utils/Currencies";
import * as BN from "bn.js";
import { BitcoinWalletContext } from "./context/BitcoinWalletContext";
import { useContext, useEffect, useState } from "react";
import { Accordion, Badge, OverlayTrigger, Spinner, Tooltip } from "react-bootstrap";
import { getFeePct } from "../utils/Utils";
import Icon from "react-icons-kit";
import { ic_receipt_outline } from 'react-icons-kit/md/ic_receipt_outline';
import { FEConstants } from "../FEConstants";
function FeePart(props) {
    return (_jsxs("div", { className: "d-flex font-medium " + props.className, children: [_jsxs("small", { className: "d-flex align-items-center" + (props.bold ? " fw-bold" : ""), children: [props.text, props.feePPM == null ? "" : props.feeBase == null ? (_jsxs(Badge, { bg: "primary", className: "ms-1 pill-round px-2", pill: true, children: [props.feePPM.toNumber() / 10000, " %"] })) : (_jsx(OverlayTrigger, { overlay: _jsx(Tooltip, { id: "fee-tooltip-" + props.text, children: _jsxs("span", { children: [props.feePPM.toNumber() / 10000, "% + ", toHumanReadableString(props.feeBase, props.feeCurrency), " ", props.feeCurrency.ticker] }) }), children: _jsx(Badge, { bg: "primary", className: "ms-1 pill-round px-2", pill: true, children: _jsxs("span", { className: "dottedUnderline", children: [props.feePPM.toNumber() / 10000, "%"] }) }) })), props.description != null ? (_jsx(OverlayTrigger, { overlay: _jsx(Tooltip, { id: "fee-tooltip-desc-" + props.text, children: _jsx("span", { children: props.description }) }), children: _jsx(Badge, { bg: "primary", className: "ms-1 pill-round px-2", pill: true, children: _jsx("span", { className: "dottedUnderline", children: "?" }) }) })) : ""] }), _jsx("span", { className: "ms-auto fw-bold d-flex align-items-center", children: _jsx(OverlayTrigger, { placement: "left", overlay: _jsx(Tooltip, { id: "fee-tooltip-" + props.text, className: "font-default", children: props.currency2 == null ? (_jsxs("span", { className: "ms-auto d-flex align-items-center", children: [_jsx("img", { src: props.currency1.icon, className: "currency-icon-small", style: { marginTop: "-2px" } }), _jsxs("span", { children: [toHumanReadableString(props.amount1, props.currency1), " ", props.currency1.ticker] })] })) : (_jsxs("span", { className: "ms-auto text-end", children: [_jsxs("span", { className: "d-flex align-items-center justify-content-start", children: [_jsx("img", { src: props.currency1.icon, className: "currency-icon-small", style: { marginTop: "-1px" } }), _jsxs("span", { children: [toHumanReadableString(props.amount1, props.currency1), " ", props.currency1.ticker] })] }), _jsxs("span", { className: "d-flex align-items-center justify-content-start", children: [_jsx("img", { src: props.currency2.icon, className: "currency-icon-small" }), _jsxs("span", { children: [toHumanReadableString(props.amount2, props.currency2), " ", props.currency2.ticker] })] })] })) }), children: _jsxs("span", { className: "text-decoration-dotted font-monospace", children: ["$", (props.usdValue == null ? 0 : props.usdValue).toFixed(2)] }) }) })] }));
}
function FeeSummary(props) {
    const totalUsdFee = props.feeBreakdown == null ? 0 : props.feeBreakdown.reduce((value, e) => e.usdValue == null ? value : value + parseFloat(e.usdValue.toFixed(2)), 0);
    const src = toHumanReadable(props.srcAmount, props.srcCurrency);
    const dst = toHumanReadable(props.dstAmount, props.dstCurrency);
    const price = src.div(dst);
    return (_jsx(Accordion, { children: _jsxs(Accordion.Item, { eventKey: "0", className: "tab-accent-nop", children: [_jsxs(Accordion.Header, { className: "font-bigger d-flex flex-row", bsPrefix: "fee-accordion-header", children: [_jsxs("span", { className: "me-auto", children: ["1 ", props.dstCurrency.ticker, " = ", price.toFixed(props.srcCurrency.decimals), " ", props.srcCurrency.ticker] }), _jsx(Icon, { className: "d-flex me-1", size: 16, icon: ic_receipt_outline }), _jsx("span", { className: "me-2", children: props.loading ? (_jsx(Spinner, { animation: "border", size: "sm" })) : "$" + totalUsdFee.toFixed(2) })] }), _jsx(Accordion.Body, { className: "p-2", children: props.feeBreakdown.map((e, index) => {
                        return (_jsx(FeePart, { className: e.className, usdValue: e.usdValue, text: e.text, description: e.description, currency1: e.currency1, currency2: e.currency2, amount1: e.amount1, amount2: e.amount2, feePPM: e.feePPM, feeBase: e.feeBase, feeCurrency: e.feeCurrency }, index));
                    }) })] }) }));
}
export function SimpleFeeSummaryScreen(props) {
    const { bitcoinWallet } = useContext(BitcoinWalletContext);
    const [btcTxFee, setBtcTxFee] = useState();
    const [_btcTxFeeLoading, setBtcTxFeeLoading] = useState(false);
    const btcTxFeeLoading = bitcoinWallet != null && props.btcFeeRate != null && props.btcFeeRate != 0 && props.swap != null && props.swap instanceof FromBTCSwap && _btcTxFeeLoading;
    useEffect(() => {
        if (props.swapper == null)
            return;
        setBtcTxFee(null);
        if (bitcoinWallet == null || props.btcFeeRate == null || props.btcFeeRate == 0 || props.swap == null || !(props.swap instanceof FromBTCSwap))
            return;
        const swap = props.swap;
        setBtcTxFeeLoading(true);
        let cancelled = false;
        (async () => {
            try {
                const [usdcPrice, btcTxFee] = await Promise.all([
                    props.swapper.clientSwapContract.swapPrice.preFetchPrice(FEConstants.usdcToken),
                    bitcoinWallet.getTransactionFee(swap.address, props.swap.getInAmount(), props.btcFeeRate)
                ]);
                if (btcTxFee == null) {
                    if (cancelled)
                        return;
                    setBtcTxFeeLoading(false);
                    return;
                }
                const btcTxFeeBN = new BN(btcTxFee);
                const usdcNetworkFee = await props.swapper.clientSwapContract.swapPrice.getFromBtcSwapAmount(btcTxFeeBN, FEConstants.usdcToken, null, usdcPrice);
                if (cancelled)
                    return;
                setBtcTxFee({
                    text: "Network fee",
                    description: "Bitcoin transaction fee paid to bitcoin miners (this is a fee on top of your specified input amount)",
                    currency1: bitcoinCurrencies[0],
                    amount1: btcTxFeeBN,
                    usdValue: toHumanReadable(usdcNetworkFee, FEConstants.usdcToken).toNumber()
                });
                setBtcTxFeeLoading(false);
            }
            catch (e) {
                if (cancelled)
                    return;
                console.error(e);
                setBtcTxFeeLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [bitcoinWallet, props.btcFeeRate, props.swap, props.swapper]);
    const [scSideFees, setScSideFees] = useState();
    useEffect(() => {
        if (props.swapper == null)
            return;
        setScSideFees(null);
        if (props.swap instanceof IToBTCSwap) {
            const swap = props.swap;
            const currency = getCurrencySpec(swap.getToken());
            const btcCurrency = bitcoinCurrencies[swap instanceof ToBTCSwap ? 0 : 1];
            const swapFee = swap.getSwapFee();
            const swapBtcFee = swapFee.mul(swap.getOutAmount()).div(swap.getInAmountWithoutFee());
            const networkFee = swap.getNetworkFee();
            const networkBtcFee = networkFee.mul(swap.getOutAmount()).div(swap.getInAmountWithoutFee());
            //Swap fee, Network fee
            props.swapper.clientSwapContract.swapPrice.preFetchPrice(FEConstants.usdcToken).then(price => {
                return Promise.all([
                    props.swapper.clientSwapContract.swapPrice.getFromBtcSwapAmount(swapBtcFee, FEConstants.usdcToken, null, price),
                    props.swapper.clientSwapContract.swapPrice.getFromBtcSwapAmount(networkBtcFee, FEConstants.usdcToken, null, price)
                ]);
            }).then(([swapFeeUsdc, networkFeeUsdc]) => {
                setScSideFees([
                    {
                        text: "Swap fee",
                        feePPM: getFeePct(props.swap, 1),
                        feeBase: props.swap.pricingInfo.satsBaseFee,
                        feeCurrency: btcCurrency,
                        currency1: currency,
                        amount1: swapFee,
                        // currency2: btcCurrency,
                        // amount2: swapBtcFee,
                        usdValue: toHumanReadable(swapFeeUsdc, FEConstants.usdcToken).toNumber()
                    },
                    {
                        text: "Network fee",
                        description: props.swap instanceof ToBTCSwap ?
                            "Bitcoin transaction fee paid to bitcoin miners" :
                            "Lightning network fee paid for routing the payment through the network",
                        currency1: currency,
                        amount1: networkFee,
                        // currency2: btcCurrency,
                        // amount2: networkBtcFee,
                        usdValue: toHumanReadable(networkFeeUsdc, FEConstants.usdcToken).toNumber()
                    }
                ]);
            });
        }
        if (props.swap instanceof FromBTCSwap) {
            //Swap fee, Watchtower fee
            const swap = props.swap;
            const currency = getCurrencySpec(swap.getToken());
            const btcCurrency = bitcoinCurrencies[0];
            const fee = swap.getFee();
            const btcFee = fee.mul(swap.getInAmount()).div(swap.getOutAmountWithoutFee());
            Promise.all([
                props.swapper.clientSwapContract.swapPrice.preFetchPrice(FEConstants.usdcToken),
                props.swapper.clientSwapContract.swapPrice.getToBtcSwapAmount(swap.getClaimerBounty(), props.swapper.swapContract.getNativeCurrencyAddress())
            ]).then(([usdcPrice, claimerBountyInBtc]) => {
                return Promise.all([
                    props.swapper.clientSwapContract.swapPrice.getFromBtcSwapAmount(btcFee, FEConstants.usdcToken, null, usdcPrice),
                    props.swapper.clientSwapContract.swapPrice.getFromBtcSwapAmount(claimerBountyInBtc, FEConstants.usdcToken, null, usdcPrice)
                ]);
            }).then(([swapFeeUsdc, claimerBountyUsdc]) => {
                setScSideFees([
                    {
                        text: "Swap fee",
                        feePPM: getFeePct(props.swap, 1),
                        feeBase: swap.pricingInfo.satsBaseFee,
                        feeCurrency: btcCurrency,
                        currency1: btcCurrency,
                        amount1: btcFee,
                        // currency2: currency,
                        // amount2: fee,
                        usdValue: toHumanReadable(swapFeeUsdc, FEConstants.usdcToken).toNumber()
                    },
                    {
                        text: "Watchtower fee",
                        description: "Fee paid to swap watchtowers which automatically claim the swap for you as soon as the bitcoin transaction confirms.",
                        currency1: getNativeCurrency(),
                        amount1: swap.getClaimerBounty(),
                        usdValue: toHumanReadable(claimerBountyUsdc, FEConstants.usdcToken).toNumber()
                    }
                ]);
            });
        }
        if (props.swap instanceof FromBTCLNSwap) {
            const swap = props.swap;
            const fee = props.swap.getFee();
            const btcFee = fee.mul(props.swap.getInAmount()).div(props.swap.getOutAmountWithoutFee());
            const btcCurrency = bitcoinCurrencies[1];
            const currency = getCurrencySpec(props.swap.getToken());
            props.swapper.clientSwapContract.swapPrice.getFromBtcSwapAmount(btcFee, FEConstants.usdcToken).then((swapFeeUsdc) => {
                setScSideFees([
                    {
                        text: "Swap fee",
                        feePPM: getFeePct(props.swap, 1),
                        feeBase: props.swap.pricingInfo.satsBaseFee,
                        feeCurrency: btcCurrency,
                        currency1: btcCurrency,
                        amount1: btcFee,
                        // currency2: currency,
                        // amount2: fee,
                        usdValue: toHumanReadable(swapFeeUsdc, FEConstants.usdcToken).toNumber()
                    }
                ]);
            });
        }
    }, [props.swap, props.swapper]);
    let className;
    if (props.className == null) {
        className = "tab-accent";
    }
    else {
        className = props.className + " tab-accent";
    }
    if (props.swap instanceof IToBTCSwap) {
        const currency = getCurrencySpec(props.swap.getToken());
        const btcCurrency = bitcoinCurrencies[props.swap instanceof ToBTCSwap ? 0 : 1];
        return (_jsx(FeeSummary, { srcCurrency: currency, srcAmount: props.swap.getInAmountWithoutFee(), dstCurrency: btcCurrency, dstAmount: props.swap.getOutAmount(), feeBreakdown: scSideFees || [], loading: scSideFees == null || btcTxFeeLoading }));
    }
    if (props.swap instanceof FromBTCSwap) {
        const currency = getCurrencySpec(props.swap.getToken());
        const btcCurrency = bitcoinCurrencies[0];
        return (_jsx(FeeSummary, { srcCurrency: btcCurrency, srcAmount: props.swap.getInAmount(), dstCurrency: currency, dstAmount: props.swap.getOutAmountWithoutFee(), feeBreakdown: (btcTxFee == null ? [] : [btcTxFee]).concat(scSideFees || []), loading: scSideFees == null || btcTxFeeLoading }));
    }
    if (props.swap instanceof FromBTCLNSwap) {
        const btcCurrency = bitcoinCurrencies[1];
        const currency = getCurrencySpec(props.swap.getToken());
        return (_jsx(FeeSummary, { srcCurrency: btcCurrency, srcAmount: props.swap.getInAmount(), dstCurrency: currency, dstAmount: props.swap.getOutAmountWithoutFee(), feeBreakdown: scSideFees || [], loading: scSideFees == null || btcTxFeeLoading }));
    }
    return null;
}

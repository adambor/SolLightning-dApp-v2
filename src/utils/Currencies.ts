import {PublicKey} from "@solana/web3.js";
import {FEConstants} from "../FEConstants";
import * as BN from "bn.js";
import BigNumber from "bignumber.js";
import {smart} from "@babel/template";

export const bitcoinCurrencies: CurrencySpec[] = [
    {
        name: "Bitcoin (on-chain)",
        ticker: "BTC",
        decimals: 8,
        icon: "/icons/crypto/BTC.svg"
    },
    {
        name: "Bitcoin (lightning)",
        ticker: "BTC-LN",
        decimals: 8,
        icon: "/icons/crypto/BTC.svg"
    }
];

export const btcCurrency: CurrencySpec = {
    name: "Bitcoin",
    ticker: "BTC",
    decimals: 8,
    icon: "/icons/crypto/BTC.svg"
};

export const smartChainCurrencies: CurrencySpec[] = [
    {
        name: "Solana",
        ticker: "SOL",
        decimals: 9,
        address: new PublicKey(FEConstants.wsolToken),
        icon: "/icons/crypto/SOL.svg"
    },
    {
        name: "USD Circle",
        ticker: "USDC",
        decimals: 6,
        address: new PublicKey(FEConstants.usdcToken),
        icon: "/icons/crypto/USDC.svg"
    }
];

const scCurrencyMap: {[key: string]: CurrencySpec} = {};

smartChainCurrencies.forEach(curr => {
    scCurrencyMap[curr.address.toString()] = curr;
});

export type CurrencySpec = {
    name: string,
    ticker: string,
    decimals: number,
    icon: string,
    address?: any
}

export function isCurrencySpec(val: any) {
    return typeof(val.name)==="string" &&
        typeof(val.ticker)==="string" &&
        typeof(val.decimals)==="number" &&
        typeof(val.icon)==="string";
}

export function getNativeCurrency(): CurrencySpec {
    return smartChainCurrencies[0];
}

export function getCurrencySpec(address: PublicKey | string) {
    return scCurrencyMap[address.toString()];
}

export function toHumanReadable(amount: BN, currencySpec: CurrencySpec | PublicKey | string): BigNumber {
    let spec: CurrencySpec;
    if(!isCurrencySpec(currencySpec)) {
        spec = scCurrencyMap[currencySpec.toString()];
    } else {
        spec = currencySpec as CurrencySpec;
    }
    return new BigNumber(amount.toString(10)).dividedBy(new BigNumber(10).pow(new BigNumber(spec.decimals)));
}

export function toHumanReadableString(amount: BN, currencySpec: CurrencySpec | PublicKey | string): string {
    let spec: CurrencySpec;
    if(!isCurrencySpec(currencySpec)) {
        spec = scCurrencyMap[currencySpec.toString()];
    } else {
        spec = currencySpec as CurrencySpec;
    }
    return new BigNumber(amount.toString(10)).dividedBy(new BigNumber(10).pow(new BigNumber(spec.decimals))).toFixed(spec.decimals);
}

export function fromHumanReadable(amount: BigNumber, currencySpec: CurrencySpec | PublicKey | string): BN {
    let spec: CurrencySpec;
    if(!isCurrencySpec(currencySpec)) {
        spec = scCurrencyMap[currencySpec.toString()];
    } else {
        spec = currencySpec as CurrencySpec;
    }
    return new BN(amount.multipliedBy(new BigNumber(10).pow(new BigNumber(spec.decimals))).toFixed(0));
}

export function fromHumanReadableString(amount: string, currencySpec: CurrencySpec | PublicKey | string): BN {
    let spec: CurrencySpec;
    if(!isCurrencySpec(currencySpec)) {
        spec = scCurrencyMap[currencySpec.toString()];
    } else {
        spec = currencySpec as CurrencySpec;
    }
    return new BN(new BigNumber(amount).multipliedBy(new BigNumber(10).pow(new BigNumber(spec.decimals))).toFixed(0));
}
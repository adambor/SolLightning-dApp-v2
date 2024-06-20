import * as BN from "bn.js";
import { FromBTCLNSwap, FromBTCSwap, IToBTCSwap } from "sollightning-sdk";
export function getDeltaTextHours(delta) {
    const deltaSeconds = Math.floor(delta / 1000);
    if (deltaSeconds < 60) {
        return deltaSeconds + " " + (deltaSeconds === 1 ? "second" : "seconds");
    }
    let deltaMinutes = Math.floor(deltaSeconds / 60);
    if (deltaSeconds < 60 * 60) {
        return deltaMinutes + " " + (deltaMinutes === 1 ? "minute" : "minutes");
    }
    if (deltaSeconds < 60 * 60 * 24) {
        const deltaHours = Math.floor(deltaMinutes / 60);
        deltaMinutes -= deltaHours * 60;
        return deltaHours + " " + (deltaHours === 1 ? "hour" : "hours") + " " + deltaMinutes + " " + (deltaMinutes === 1 ? "minute" : "minutes");
    }
}
export function getDeltaText(delta) {
    const deltaSeconds = Math.floor(delta / 1000);
    if (deltaSeconds < 60) {
        return deltaSeconds + " " + (deltaSeconds === 1 ? "second" : "seconds");
    }
    if (deltaSeconds < 60 * 60) {
        const deltaMinutes = Math.floor(deltaSeconds / (60));
        return deltaMinutes + " " + (deltaMinutes === 1 ? "minute" : "minutes");
    }
    if (deltaSeconds < 60 * 60 * 24) {
        const deltaHours = Math.floor(deltaSeconds / (60 * 60));
        return deltaHours + " " + (deltaHours === 1 ? "hour" : "hours");
    }
    if (deltaSeconds < 60 * 60 * 24 * 30) {
        const deltaDays = Math.floor(deltaSeconds / (60 * 60 * 24));
        return deltaDays + " " + (deltaDays === 1 ? "day" : "days");
    }
    if (deltaSeconds < 60 * 60 * 24 * 30 * 12) {
        const deltaMonths = Math.floor(deltaSeconds / (60 * 60 * 24 * 30));
        return deltaMonths + " " + (deltaMonths === 1 ? "month" : "months");
    }
    const deltaYears = Math.floor(deltaSeconds / (60 * 60 * 24 * 30 * 12));
    return deltaYears + " " + (deltaYears === 1 ? "year" : "years");
}
export function getTimeDeltaText(timestamp, forward) {
    const delta = forward ? timestamp - Date.now() : Date.now() - timestamp;
    const deltaSeconds = Math.floor(delta / 1000);
    if (deltaSeconds < 60) {
        return deltaSeconds + " " + (deltaSeconds === 1 ? "second" : "seconds");
    }
    if (deltaSeconds < 60 * 60) {
        const deltaMinutes = Math.floor(deltaSeconds / (60));
        return deltaMinutes + " " + (deltaMinutes === 1 ? "minute" : "minutes");
    }
    if (deltaSeconds < 60 * 60 * 24) {
        const deltaHours = Math.floor(deltaSeconds / (60 * 60));
        return deltaHours + " " + (deltaHours === 1 ? "hour" : "hours");
    }
    if (deltaSeconds < 60 * 60 * 24 * 30) {
        const deltaDays = Math.floor(deltaSeconds / (60 * 60 * 24));
        return deltaDays + " " + (deltaDays === 1 ? "day" : "days");
    }
    if (deltaSeconds < 60 * 60 * 24 * 30 * 12) {
        const deltaMonths = Math.floor(deltaSeconds / (60 * 60 * 24 * 30));
        return deltaMonths + " " + (deltaMonths === 1 ? "month" : "months");
    }
    const deltaYears = Math.floor(deltaSeconds / (60 * 60 * 24 * 30 * 12));
    return deltaYears + " " + (deltaYears === 1 ? "year" : "years");
}
export function elementInViewport(el) {
    let top = el.offsetTop;
    let left = el.offsetLeft;
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    while (el.offsetParent) {
        el = el.offsetParent;
        top += el.offsetTop;
        left += el.offsetLeft;
    }
    return (top >= window.pageYOffset &&
        left >= window.pageXOffset &&
        (top + height) <= (window.pageYOffset + window.innerHeight) &&
        (left + width) <= (window.pageXOffset + window.innerWidth));
}
//Workaround to variable returned PPM fee due to referral programme
export function getFeePPM(swap) {
    if (swap instanceof IToBTCSwap) {
        const fee = swap.getSwapFee();
        const baseFeeInToken = swap.pricingInfo.satsBaseFee.mul(swap.getInAmountWithoutFee()).div(swap.getOutAmount());
        const feeWithoutBaseFee = fee.sub(baseFeeInToken);
        return feeWithoutBaseFee.mul(new BN(1000000)).div(swap.getInAmountWithoutFee());
    }
    else if (swap instanceof FromBTCLNSwap) {
        const fee = swap.getFee();
        const baseFeeInToken = swap.pricingInfo.satsBaseFee.mul(swap.getOutAmountWithoutFee()).div(swap.getInAmount());
        const feeWithoutBaseFee = fee.sub(baseFeeInToken);
        return feeWithoutBaseFee.mul(new BN(1000000)).div(swap.getOutAmountWithoutFee());
    }
    else if (swap instanceof FromBTCSwap) {
        const fee = swap.getFee();
        const baseFeeInToken = swap.pricingInfo.satsBaseFee.mul(swap.getOutAmountWithoutFee()).div(swap.getInAmount());
        const feeWithoutBaseFee = fee.sub(baseFeeInToken);
        return feeWithoutBaseFee.mul(new BN(1000000)).div(swap.getOutAmountWithoutFee());
    }
}
export function getFeePct(swap, digits) {
    const feeOriginal = getFeePPM(swap);
    // console.log("Fee PPM: ", feeOriginal.toString(10));
    const feePPM = feeOriginal.add(new BN(9).mul(new BN(10).pow(new BN(3 - digits))));
    // console.log("Fee PPM: ", feePPM.toString(10));
    return feePPM.div(new BN(10).pow(new BN(4 - digits))).mul(new BN(10).pow(new BN(4 - digits)));
}

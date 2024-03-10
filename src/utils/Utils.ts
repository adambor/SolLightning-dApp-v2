export function getTimeDeltaText(timestamp: number, forward?: boolean): string {
    const delta = forward ? timestamp-Date.now() : Date.now()-timestamp;
    const deltaSeconds = Math.floor(delta/1000);
    if(deltaSeconds<60) {
        return deltaSeconds+" "+(deltaSeconds===1 ? "second" : "seconds");
    }
    if(deltaSeconds<60*60) {
        const deltaMinutes = Math.floor(deltaSeconds/(60));
        return deltaMinutes+" "+(deltaMinutes===1 ? "minute" : "minutes");
    }
    if(deltaSeconds<60*60*24) {
        const deltaHours = Math.floor(deltaSeconds/(60*60));
        return deltaHours+" "+(deltaHours===1 ? "hour" : "hours");
    }
    if(deltaSeconds<60*60*24*30) {
        const deltaDays = Math.floor(deltaSeconds/(60*60*24));
        return deltaDays+" "+(deltaDays===1 ? "day" : "days");
    }
    if(deltaSeconds<60*60*24*30*12) {
        const deltaMonths = Math.floor(deltaSeconds/(60*60*24*30));
        return deltaMonths+" "+(deltaMonths===1 ? "month" : "months");
    }
    const deltaYears = Math.floor(deltaSeconds/(60*60*24*30*12));
    return deltaYears+" "+(deltaYears===1 ? "year" : "years");
}

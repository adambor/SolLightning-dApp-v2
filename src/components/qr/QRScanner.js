import { jsx as _jsx } from "react/jsx-runtime";
import QrScanner from 'qr-scanner';
import { useEffect, useRef } from "react";
export function QRScanner(props) {
    const videoRef = useRef(null);
    const callbackRef = useRef(null);
    useEffect(() => {
        callbackRef.current = props.onResult;
    }, [props.onResult]);
    useEffect(() => {
        const qrScanner = new QrScanner(videoRef.current, result => callbackRef.current(result.data, null), {
            preferredCamera: props.camera,
            highlightScanRegion: true,
            highlightCodeOutline: false,
            returnDetailedScanResult: true
        });
        qrScanner.start();
        return () => {
            qrScanner.stop();
        };
    }, [props.camera]);
    return (_jsx("video", { ref: videoRef, className: "qr-video", style: {
            //width: "100%",
            height: "100%"
        } }));
}

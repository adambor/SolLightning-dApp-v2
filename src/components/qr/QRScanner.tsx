import QrScanner from 'qr-scanner';
import * as React from "react";
import {useEffect, useRef} from "react";


export function QRScanner(props: {
    onResult: (data: string, err) => void,
    camera: "user" | "environment"
}) {

    const videoRef = useRef<HTMLVideoElement>(null);

    const callbackRef = useRef<(data: string, err) => void>(null);

    useEffect(() => {
        callbackRef.current = props.onResult;
    }, [props.onResult]);

    useEffect(() => {
        const qrScanner = new QrScanner(
            videoRef.current,
            result => callbackRef.current(result.data, null),
            {
                preferredCamera: props.camera,
                highlightScanRegion: true,
                highlightCodeOutline: false,
                returnDetailedScanResult: true
            },
        );
        qrScanner.start();

        return () => {
            qrScanner.stop();
        }
    }, [props.camera]);

    return (
        <video ref={videoRef} className="qr-video" style={{
            //width: "100%",
            height: "100%"
        }}>

        </video>
    );
}
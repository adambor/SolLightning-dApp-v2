import QrScanner from 'qr-scanner';
import * as React from "react";
import {useEffect, useRef} from "react";


export function QRScanner(props: {
    onResult: (data: string, err) => void,
    camera: "user" | "environment"
}) {

    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const qrScanner = new QrScanner(
            videoRef.current,
            result => props.onResult(result.data, null),
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
    }, []);

    return (
        <video ref={videoRef} className="qr-video" style={{
            //width: "100%",
            height: "100%"
        }}>

        </video>
    );
}
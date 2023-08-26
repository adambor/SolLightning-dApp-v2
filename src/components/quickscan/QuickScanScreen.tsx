import {QRScanner} from "../qr/QRScanner";
import {Button} from "react-bootstrap";

export function QuickScanScreen() {

    return (
        <div className="d-flex flex-column flex-grow-1">
            <div className="d-flex align-content-center justify-content-center flex-fill" style={{
                maxWidth: "100vw",
            }}>
                <QRScanner onResult={(result, err) => {

                }} camera={"environment"}/>
            </div>
            <div className="bg-dark p-3">
                <Button>Paste address</Button>
            </div>
        </div>
    )
}
import {QRScanner} from "../qr/QRScanner";
import {Button} from "react-bootstrap";

export function QuickScanScreen(props: {
    onScanned: (data: string) => void
}) {

    return (
        <div className="d-flex flex-column flex-grow-1">
            <div className="d-flex align-content-center justify-content-center flex-fill" style={{
                position: "absolute",
                top: "0px",
                bottom: "0px",
                right: "0px",
                left: "0px",
                zIndex: -1
            }}>
                <QRScanner onResult={(result, err) => {
                    if(result!=null) props.onScanned(result);
                }} camera={"environment"}/>
            </div>

            <div className="bg-dark p-3 mt-auto">
                <Button>Paste from clipboard</Button>
            </div>
        </div>
    )
}
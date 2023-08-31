import {QRScanner} from "../qr/QRScanner";
import {Button} from "react-bootstrap";
import {useNavigate} from "react-router-dom";
import {Topbar} from "../Topbar";

export function QuickScanScreen(props: {
    onScanned?: (data: string) => void
}) {
    const navigate = useNavigate();


    return (
        <>
            <Topbar selected={1} enabled={true}/>
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
                        if(result!=null) {
                            if(props.onScanned!=null) {
                                props.onScanned(result);
                            } else {
                                navigate("/scan/2?address="+encodeURIComponent(result));
                            }
                        }
                    }} camera={"environment"}/>
                </div>

                <div className="bg-dark p-4 mt-auto">
                    {/*<Button>Paste from clipboard</Button>*/}
                </div>
            </div>
        </>
    )
}
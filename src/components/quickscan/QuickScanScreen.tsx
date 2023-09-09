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
                    top: "4rem",
                    bottom: "4rem",
                    right: "0px",
                    left: "0px",
                    zIndex: 0
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

                <div className="bg-dark bg-opacity-25 p-5 mt-auto">
                    {/*<Button>Paste from clipboard</Button>*/}
                </div>
            </div>
        </>
    )
}
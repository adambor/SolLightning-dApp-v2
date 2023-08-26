import './App.css';
import * as React from "react";
import WalletTab from "./components/WalletTab";
//import WrappedApp from "./WrappedApp";
import {QuickScanScreen} from "./components/quickscan/QuickScanScreen";
import {Step2Screen} from "./components/quickscan/Step2Screen";

require('@solana/wallet-adapter-react-ui/styles.css');

function App() {
    return (
        <div className="App d-flex flex-column">
            <WalletTab>
                {/*<WrappedApp/>*/}
                <Step2Screen type={"send"}/>
            </WalletTab>
        </div>
    );
}

export default App;

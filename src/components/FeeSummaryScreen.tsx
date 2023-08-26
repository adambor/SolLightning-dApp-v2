

export function FeeSummaryScreen() {

    return (<div>

        <div className="d-flex my-2">
            <span>Amount:</span>
            <span className="ms-auto">0.02736 SOL</span>
        </div>
        <div className="d-flex my-2">
            <span>Swap fee:</span>
            <span className="ms-auto">0.00026 SOL</span>
        </div>
        <div className="d-flex my-2">
            <span>Network fee:</span>
            <span className="ms-auto">0.00036 SOL</span>
        </div>

        <div className="d-flex fw-bold">
            <span>Total:</span>
            <span className="ms-auto">0.02987 SOL</span>
        </div>

    </div>);
}
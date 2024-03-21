import * as React from "react";
import {Badge, Button, Card, Col, OverlayTrigger, Placeholder, Row, Tooltip} from "react-bootstrap";
import {FEConstants} from "../../FEConstants";
import {useEffect, useMemo, useRef, useState} from "react";
import {SingleColumnBackendTable} from "../table/SingleColumnTable";
import {bitcoinCurrencies, CurrencySpec, getCurrencySpec, toHumanReadable, toHumanReadableString} from "../../utils/Currencies";
import * as BN from "bn.js";
import Icon from "react-icons-kit";
import {ic_arrow_forward} from 'react-icons-kit/md/ic_arrow_forward';
import {ic_arrow_downward} from 'react-icons-kit/md/ic_arrow_downward';
import ValidatedInput, {ValidatedInputRef} from "../ValidatedInput";
import {ChainSwapType} from "sollightning-sdk";
import {getTimeDeltaText} from "../../utils/Utils";

export function SwapExplorer(props: {}) {

    const refreshTable = useRef<() => void>(null);

    const [statsLoading, setStatsLoading] = useState<boolean>(false);
    const [stats, setStats] = useState<{
        "totalSwapCount": number,
        "totalUsdVolume": number,
        "currencyData": {
            "SOL": {
                "count": number,
                "volume": number,
                "volumeUsd": number
            },
            "USDC": {
                "count": number,
                "volume": number,
                "volumeUsd": number
            }
        }
    }>(null);

    const [search, setSearch] = useState<string>();
    const searchRef = useRef<ValidatedInputRef>();

    useEffect(() => {

        const abortController = new AbortController();

        setStatsLoading(true);
        fetch(FEConstants.statsUrl+"/GetStats", {signal: abortController.signal}).then(resp => {
            return resp.json();
        }).then(obj => {
            setStats(obj);
            setStatsLoading(false);
        }).catch(e => {
            console.error(e);
            setStatsLoading(false);
        });

        return () => abortController.abort();

    }, []);

    const additionalData = useMemo(() => {
        const additionalData: any = {};
        if(search!=null) additionalData.search = search;
        console.log(additionalData);
        return additionalData;
    }, [search])

    return (
        <div className="flex-fill text-white container mt-5 text-start">
            <h1 className="section-title">Statistics</h1>

            <Row>
                <Col xs={12} md={6} className="pb-3">
                    <Card className="px-3 pt-3 bg-dark bg-opacity-25 height-100 border-0">
                        <span className="">Total swaps</span>
                        <h3>{statsLoading ? (
                            <Placeholder xs={6} />
                        ) : stats?.totalSwapCount}</h3>
                    </Card>
                </Col>
                <Col xs={12} md={6} className="pb-3">
                    <Card className="px-3 pt-3 bg-dark bg-opacity-25 height-100 border-0">
                        <span>Total volume</span>
                        <h3>{statsLoading ? (
                            <Placeholder xs={6} />
                        ) : (stats?.totalUsdVolume==null ? null : FEConstants.USDollar.format(stats.totalUsdVolume))}</h3>
                    </Card>
                </Col>
            </Row>

            <h1 className="section-title mt-4">Explorer</h1>

            <div className="d-flex flex-row mb-3">
                <ValidatedInput
                    className="width-300px"
                    type={"text"}
                    placeholder={"Search by tx ID or wallet address"}
                    inputRef={searchRef}
                />
                <Button className="ms-2" onClick={() => {
                    const val = searchRef.current.getValue();
                    if(val==="") {
                        setSearch(null);
                    } else {
                        setSearch(val);
                    }
                }}>Search</Button>
            </div>

            <div>
                <SingleColumnBackendTable<{
                    paymentHash: string,

                    timestampInit: number,
                    timestampFinish: number,

                    type: "LN" | "CHAIN",
                    direction: "ToBTC" | "FromBTC",
                    kind: ChainSwapType,
                    nonce: string,

                    lpWallet: string,
                    clientWallet: string,

                    token: string,
                    tokenName: string,
                    tokenAmount: string,
                    rawAmount: string,

                    txInit: string,
                    txFinish: string,

                    btcTx: string,
                    btcOutput?: number,
                    btcAddress?: string,
                    btcAmount?: string,
                    btcRawAmount?: string,
                    btcInAddresses?: string[],

                    success: boolean,
                    finished: boolean,

                    price: string,
                    usdValue: string,

                    id: string,
                    _tokenAmount: number,
                    _rawAmount: number,
                    _usdValue: number,
                    _btcRawAmount: number,
                    _btcAmount: number
                }>
                    column={{
                        renderer: (row) => {
                            let inputAmount: BN;
                            let inputCurrency: CurrencySpec;
                            let outputAmount: BN;
                            let outputCurrency: CurrencySpec;

                            let inputExplorer;
                            let txIdInput;
                            let outputExplorer;
                            let txIdOutput;

                            let inputAddress: string = "Unknown";
                            let outputAddress: string = "Unknown";

                            let inputInfo: string;
                            let outputInfo: string;

                            if(row.direction==="ToBTC") {
                                inputAmount = new BN(row.rawAmount);
                                inputCurrency = getCurrencySpec(row.token);
                                outputAmount = row.btcRawAmount==null ? null : new BN(row.btcRawAmount);
                                outputCurrency = row.type==="CHAIN" ? bitcoinCurrencies[0] : bitcoinCurrencies[1];
                                txIdInput = row.txInit;
                                txIdOutput = row.type==="CHAIN" ? row.btcTx : row.paymentHash;
                                inputExplorer = FEConstants.solBlockExplorer;
                                outputExplorer = row.type==="CHAIN" ? FEConstants.btcBlockExplorer : null;
                                if(row.type==="LN") {
                                    outputInfo = "Lightning network amounts and addresses are private!";
                                } else if(!row.finished) {
                                    outputInfo = "BTC amounts for pending swaps are blinded!";
                                } else if(!row.success) {
                                    outputInfo = "BTC amounts & addresses for failed swaps are never un-blinded!";
                                }
                                inputAddress = row.clientWallet;
                                if(row.type==="CHAIN") outputAddress = row.btcAddress || "Unknown";
                            } else {
                                outputAmount = new BN(row.rawAmount);
                                outputCurrency = getCurrencySpec(row.token);
                                inputAmount = row.btcRawAmount==null ? null : new BN(row.btcRawAmount);
                                inputCurrency = row.type==="CHAIN" ? bitcoinCurrencies[0] : bitcoinCurrencies[1];
                                txIdOutput = row.txInit;
                                txIdInput = row.type==="CHAIN" ? row.btcTx : row.paymentHash;
                                outputExplorer = FEConstants.solBlockExplorer;
                                inputExplorer = row.type==="CHAIN" ? FEConstants.btcBlockExplorer : null;
                                if(row.type==="LN") {
                                    inputInfo = "Lightning network amounts and addresses are private!";
                                } else if(!row.finished) {
                                    inputInfo = "BTC amounts for pending swaps are blinded!";
                                } else if(!row.success) {
                                    inputInfo = "BTC amounts & addresses for failed swaps are never un-blinded!";
                                }
                                outputAddress = row.clientWallet;
                                if(row.type==="CHAIN" && row.btcInAddresses!=null) {
                                    inputAddress = row.btcInAddresses[0];
                                }
                            }

                            return (
                                <Row className="d-flex flex-row gx-1 gy-1">
                                    <Col xl={2} md={12} className="d-flex text-md-end text-start">
                                        <Row className="gx-1 gy-0 width-fill">
                                            <Col xl={6} md={2} xs={6}>
                                                {!row.finished ? (
                                                    <Badge bg="primary" className="width-fill">Pending</Badge>
                                                ) : row.success ? (
                                                    <Badge bg="success" className="width-fill">Success</Badge>
                                                ) : row.direction==="FromBTC" ? (
                                                    <Badge bg="warning" className="width-fill bg-atomiq-orange">Expired</Badge>
                                                ) : (
                                                    <Badge bg="danger" className="width-fill">Refunded</Badge>
                                                )}
                                            </Col>
                                            <Col xl={6} md={2} xs={6}>
                                                {row.type==="CHAIN" ? (
                                                    <Badge bg="warning" className="width-fill">On-chain</Badge>
                                                ) : (
                                                    <Badge bg="dark" className="width-fill">Lightning</Badge>
                                                )}
                                            </Col>
                                            <Col xl={0} lg={2} md={1} xs={0}>
                                            </Col>
                                            <Col xl={12} lg={2} md={3} xs={6}>
                                                <small className="">{new Date(row.timestampInit*1000).toLocaleString()}</small>
                                            </Col>
                                            <Col xl={12} md={2} xs={3}>
                                                <small className="">{getTimeDeltaText(row.timestampInit*1000)} ago</small>
                                            </Col>
                                            <Col xl={12} md={2} xs={3} className="text-end">
                                                <span className="font-weight-500">{FEConstants.USDollar.format(row._usdValue)}</span>
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col xl={10} md={12} className="d-flex">
                                        <div className="card border-0 bg-white bg-opacity-10 p-2 width-fill container-fluid">
                                            <Row className="">
                                                <Col md={6} xs={12} className="d-flex flex-row align-items-center">
                                                    <div className="min-width-0 me-md-2">
                                                        <a className="font-small single-line-ellipsis" target="_blank" href={inputExplorer==null || txIdInput==null ? null : inputExplorer+txIdInput}>{txIdInput || "None"}</a>
                                                        <span className="d-flex align-items-center font-weight-500 my-1">
                                                            <img src={inputCurrency.icon} className="currency-icon-medium"/>
                                                            {inputAmount==null ? "???" : toHumanReadableString(inputAmount, inputCurrency)} {inputCurrency.ticker}
                                                            {inputInfo!=null ? (
                                                                <OverlayTrigger overlay={<Tooltip id={"explorer-tooltip-in-"+row.id}>
                                                                    {inputInfo}
                                                                </Tooltip>}>
                                                                    <Badge bg="primary" className="ms-2 pill-round px-2" pill>?</Badge>
                                                                </OverlayTrigger>
                                                            ) : ""}
                                                        </span>
                                                        <small className="single-line-ellipsis">{inputAddress}</small>
                                                    </div>
                                                    <Icon size={22} icon={ic_arrow_forward} className="d-md-block d-none" style={{marginLeft: "auto", marginRight: "-22px", marginBottom: "6px"}}/>
                                                </Col>
                                                <Col md={0} xs={12} className="d-md-none d-flex justify-content-center">
                                                    <Icon size={22} icon={ic_arrow_downward} className="" style={{marginBottom: "6px"}}/>
                                                </Col>
                                                <Col md={6} xs={12} className="ps-md-4">
                                                    <a className="font-small single-line-ellipsis" target="_blank" href={outputExplorer==null || txIdOutput==null ? null : outputExplorer+txIdOutput}>{txIdOutput || "..."}</a>
                                                    <span className="d-flex align-items-center font-weight-500 my-1">
                                                        <img src={outputCurrency.icon} className="currency-icon-medium"/>
                                                        {outputAmount==null ? "???" : toHumanReadableString(outputAmount, outputCurrency)} {outputCurrency.ticker}
                                                        {outputInfo!=null ? (
                                                            <OverlayTrigger overlay={<Tooltip id={"explorer-tooltip-out-"+row.id}>
                                                                {outputInfo}
                                                            </Tooltip>}>
                                                                <Badge bg="primary" className="ms-2 pill-round px-2" pill>?</Badge>
                                                            </OverlayTrigger>
                                                        ) : ""}
                                                    </span>
                                                    <small className="single-line-ellipsis">{outputAddress}</small>
                                                </Col>
                                            </Row>
                                        </div>
                                    </Col>
                                </Row>
                            );
                        }
                    }}
                    endpoint={FEConstants.statsUrl+"/GetSwapList"}
                    itemsPerPage={10}
                    refreshFunc={refreshTable}
                    additionalData={additionalData}
                />
            </div>
        </div>
    );
}
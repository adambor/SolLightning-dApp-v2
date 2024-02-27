import {ButtonGroup, Spinner, Table} from "react-bootstrap";
import * as React from "react";
import {MutableRefObject, useCallback, useEffect, useRef} from "react";
import Button from "react-bootstrap/Button";

import { Icon } from "react-icons-kit";
import {caretUp} from 'react-icons-kit/fa/caretUp';
import {caretDown} from 'react-icons-kit/fa/caretDown';
import {angleRight} from 'react-icons-kit/fa/angleRight';
import {angleLeft} from 'react-icons-kit/fa/angleLeft';
import {angleDoubleRight} from 'react-icons-kit/fa/angleDoubleRight';
import {angleDoubleLeft} from 'react-icons-kit/fa/angleDoubleLeft';

function PaginationButton(props : {
    page: number,
    onClick: (page: number) => void,
    currentPage: number,
    disabled: boolean
}) {

    return (
        <Button onClick={() => {props.onClick(props.page)}} key={"page-"+props.page} variant={props.currentPage===props.page ? "info" : "outline-secondary"} disabled={props.disabled} className={"px-3 "+(props.currentPage===props.page ? "text-white" : "text-dark")} size="lg">{props.page+1}</Button>
    );
}

type TableColumn = {
    accessor: string,
    header: string | JSX.Element,
    renderer?: (any) => string | JSX.Element,
    sortable?: boolean,
    minWidth?: string,
    maxWidth?: string
};

type GetPageResponse = {
    data: any[],
    maxPages: number
}

function ResponsiveTable(props : {
    className?: any,
    getPage: (page: number, pageSize: number, sortBy: string, sortDescending: boolean) => (Promise<GetPageResponse> | GetPageResponse),
    itemsPerPage?: number,
    columns: TableColumn[],
    defaultSortedBy?: string,
    defaultSortedDescending?: boolean,
    numPageButtons?: number,
    loading?: boolean,
    getTdProps?: (row: any, column: string) => any,
    refresh?: MutableRefObject<() => void>
}) {

    const [state, setState] = React.useState<{
        sortedBy: string,
        sortedDescending: boolean,
        page: number,
        pageData: any[],
        maxPages: number,
        loading: boolean
    }>({
        page: 0,
        sortedBy: null,
        sortedDescending: false,
        pageData: [],
        maxPages: 0,
        loading: false
    });

    const loading = props.loading || state.loading;

    const sortBy = state.sortedBy || props.defaultSortedBy;
    const sortDescending = state.sortedBy==null ? props.defaultSortedDescending : state.sortedDescending;

    const itemsPerPage = props.itemsPerPage || 10;

    const renderFunc = () => {
        console.log("Table re-render: ", [sortBy, sortDescending, state.page, props.getPage]);

        const maybePromise = props.getPage(state.page, itemsPerPage, sortBy, sortDescending);

        if(maybePromise instanceof Promise) {
            setState((val) => {
                return {...val, loading: true};
            });
            maybePromise.then((obj) => {
                setState((val) => {
                    return {...val, maxPages: obj.maxPages, pageData: obj.data, loading: false};
                });
            });
        } else {
            setState((val) => {
                return {...val, maxPages: maybePromise.maxPages, pageData: maybePromise.data};
            });
        }
    };

    if(props.refresh!=null) props.refresh.current = renderFunc;

    useEffect(renderFunc, [sortBy, sortDescending, state.page, props.getPage]);

    const thead = [];

    for(let column of props.columns) {
        if(column.sortable) {
            thead.push((
                <th style={{
                    width: column.minWidth,
                    maxWidth: column.maxWidth
                }} key={column.accessor} className="px-3 py-2 cursor-pointer" onClick={() => {
                    setState((val) => {
                        const sortBy = state.sortedBy || props.defaultSortedBy;
                        const sortDescending = state.sortedBy==null ? props.defaultSortedDescending : state.sortedDescending;

                       if(sortBy===column.accessor) {
                           return {...val, sortedBy: column.accessor, sortedDescending: !sortDescending, page: 0};
                       } else {
                           return {...val, sortedBy: column.accessor, sortedDescending: false, page: 0};
                       }
                    });
                }}>
                    <div className="d-flex align-items-center">
                        {column.header}
                        <div className="d-inline-flex flex-column ms-auto">
                            <Icon icon={caretUp} className={(sortBy===column.accessor && !sortDescending ? "text-primary" : "")+" square16"} style={{
                                marginBottom: "-4px",
                                marginTop: "-4px"
                            }}/>
                            <Icon icon={caretDown} className={(sortBy===column.accessor && sortDescending ? "text-primary" : "")+" square16"} style={{
                                marginBottom: "0px",
                                marginTop: "-4px"
                            }}/>
                        </div>
                    </div>
                </th>
            ));
        } else {
            thead.push((
                <th className="px-3 py-2" style={{
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth
                }} key={column.accessor}>{column.header}</th>
            ));
        }
    }

    const tbody = [];

    for(let i=0;i<itemsPerPage;i++) {
        const row = [];
        const obj = state.pageData[i];
        for(let column of props.columns) {
            let additionalProps = {};
            if(obj!=null && props.getTdProps!=null) {
                const addProps = props.getTdProps(obj, column.accessor);
                if(addProps!=null) additionalProps = addProps;
            }
            row.push((
                <td className="px-3 py-2" style={{
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth
                }} key={column.accessor} {...additionalProps}>{obj==null ? "" : column.renderer!=null ? column.renderer(obj) : obj[column.accessor]}</td>
            ));
        }
        tbody.push((
            <tr key={i}>
                {row}
            </tr>
        ));
    }

    const numPageButtons = props.numPageButtons || 5;

    const buttons = [];

    const numPages = state.maxPages;

    const handlePageClick = (page: number) => {
        if(page<0) return;
        if(page>numPages-1) return;
        setState((val) => {return {...val, page: page}})
    };

    if(numPages<=numPageButtons) {
        for(let i=0;i<numPages;i++) {
            buttons.push((
                <PaginationButton page={i} key={"page"+i} currentPage={state.page} onClick={handlePageClick} disabled={loading}/>
            ));
        }
    } else if(state.page<(numPageButtons/2)) {
        for(let i=0;i<(numPageButtons/2)+1;i++) {
            buttons.push((
                <PaginationButton page={i} key={"page"+i} currentPage={state.page} onClick={handlePageClick} disabled={loading}/>
            ));
        }
        buttons.push((
            <Button key={"ellipsis2"} variant="outline-secondary text-dark px-3" size="lg">...</Button>
        ));
    } else if((numPages-state.page-1)<(numPageButtons/2)) {
        for(let i=0;i<(numPageButtons/2)+1;i++) {
            buttons.push((
                <PaginationButton page={numPages-i-1} key={"page"+(numPages-i-1)} currentPage={state.page} onClick={handlePageClick} disabled={loading}/>
            ));
        }
        buttons.push((
            <Button key={"ellipsis1"} variant="outline-secondary text-dark px-3" size="lg">...</Button>
        ));
        buttons.reverse();
    } else {
        buttons.push((
            <Button key={"ellipsis1"} variant="outline-secondary text-dark px-3" size="lg">...</Button>
        ));
        for(let i=state.page-1;i<=state.page+1;i++) {
            buttons.push((
                <PaginationButton page={i} key={"page"+i}  currentPage={state.page} onClick={handlePageClick} disabled={loading}/>
            ));
        }
        buttons.push((
            <Button key={"ellipsis2"} variant="outline-secondary text-dark px-3" size="lg">...</Button>
        ));
    }

    return (
        <div>
            <div className="position-relative">
                <Table responsive className="hopa-table">
                    <thead>
                    <tr>
                        {thead}
                    </tr>
                    </thead>
                    <tbody className="">
                    {tbody}
                    </tbody>
                </Table>
                {loading ? (
                    <div className="table-loading-pane d-flex align-items-center justify-content-center flex-column text-black">
                    <Spinner animation="border" role="status"/>
                    <span>Loading...</span>
                    </div>
                ) : ""}
            </div>
            <div className="d-flex">
                <ButtonGroup className="ms-auto " aria-label="Second group">
                    <Button variant="outline-secondary text-dark px-3" onClick={() => handlePageClick(0)} size="lg" disabled={loading}><Icon icon={angleDoubleLeft}/></Button>
                    <Button variant="outline-secondary text-dark px-3" onClick={() => handlePageClick(state.page-1)} size="lg" disabled={loading}><Icon icon={angleLeft}/></Button>
                    {buttons}
                    <Button variant="outline-secondary text-dark px-3" onClick={() => handlePageClick(state.page+1)} size="lg" disabled={loading}><Icon icon={angleRight}/></Button>
                    <Button variant="outline-secondary text-dark px-3" onClick={() => handlePageClick(numPages-1)} size="lg" disabled={loading}><Icon icon={angleDoubleRight}/></Button>
                </ButtonGroup>
            </div>
        </div>
    );

}

export function StaticDataTable(props: {
    className?: any,
    data?: any[],
    itemsPerPage?: number,
    columns: TableColumn[],
    defaultSortedBy?: string,
    defaultSortedDescending?: boolean,
    numPageButtons?: number,
    getTdProps?: (row: any, column: string) => any,
    loading?: boolean
}) {

    const sortedData = useRef<{
        initialData: any[],
        data: any[],
        sortBy: string,
        sortDescending: boolean
    }>(null);

    const pageCbk = useCallback(async (page: number, pageSize: number, sortBy: string, sortDescending: boolean) => {

        console.log("Page cbk called: "+page+" "+pageSize+" "+sortBy+" "+sortDescending);

        console.log("Page cbk , sortedData current: ", sortedData.current);

        if(sortedData.current!=null && sortedData.current.initialData!==props.data) sortedData.current = null;
        if(sortedData.current==null) {
            sortedData.current = {
                initialData: props.data,
                data: sortBy!=null ? [...props.data].sort((a,b) => {
                    return (""+a[sortBy]).localeCompare(b[sortBy]) * (sortDescending ? -1 : 1);
                }) : [...props.data],
                sortBy,
                sortDescending
            };
        } else {
            if(sortedData.current.sortBy!==sortBy || sortedData.current.sortDescending!==sortDescending) {
                sortedData.current = {
                    initialData: props.data,
                    data: sortBy!=null ? [...props.data].sort((a,b) => {
                        return (""+a[sortBy]).localeCompare(b[sortBy]) * (sortDescending ? -1 : 1);
                    }) : [...props.data],
                    sortBy,
                    sortDescending
                };
            }
        }

        await new Promise((resolve) => {setTimeout(resolve, 250)});

        console.log("Page cbk return: ",sortedData.current.data.slice(page*pageSize, (page+1)*pageSize));

        return {
            data: sortedData.current.data.slice(page*pageSize, (page+1)*pageSize),
            maxPages: Math.ceil(sortedData.current.data.length/pageSize)
        };

    }, [props.data]);

    return (
        <ResponsiveTable getPage={pageCbk}  {...props}/>
    )
}

export function BackendDataTable(props: {
    className?: any,
    itemsPerPage?: number,
    columns: TableColumn[],
    defaultSortedBy?: string,
    defaultSortedDescending?: boolean,
    numPageButtons?: number,
    getTdProps?: (row: any, column: string) => any,

    endpoint: string,
    additionalData?: any,
    dataPostProcessor?: (rows: any[]) => Promise<void>,
    refreshFunc?: MutableRefObject<() => void>,
    realtimeTopic?: string
}) {

    const abortSignal = useRef<AbortController>(null);

    const topicSubscription = useRef<{
        topicName: string,
        callback: (...args: any[]) => void
    }>(null);

    const sortedData = useRef<{
        pages: any[][],
        sortBy: string,
        sortDescending: boolean,
        endTime: number,
        last: boolean
    }>(null);

    const tableRefreshRef = useRef<() => void>();

    if(props.refreshFunc!=null) props.refreshFunc.current = () => {
        sortedData.current = null;
        if(tableRefreshRef.current!=null) tableRefreshRef.current();
    };

    useEffect(() => {
        return () => {
            if(abortSignal.current!=null) {
                abortSignal.current.abort();
                abortSignal.current = null;
            }
        };
    }, []);

    const memoizedGetter = useCallback(async (page: number, pageSize: number, sortBy: string, sortDescending: boolean) => {
        if(sortedData.current==null) {
            sortedData.current = {
                pages: [],
                sortBy,
                sortDescending,
                endTime: null,
                last: false
            };
        } else {
            if(sortedData.current.sortBy!==sortBy || sortedData.current.sortDescending!==sortDescending) {
                sortedData.current = {
                    pages: [],
                    sortBy,
                    sortDescending,
                    endTime: null,
                    last: false
                };
            }
        }

        if(sortedData.current.pages[page]!=null) return {
            data: sortedData.current.pages[page],
            maxPages: sortedData.current.last ? sortedData.current.pages.length : sortedData.current.pages.length+1
        };

        if(abortSignal.current!=null) {
            abortSignal.current.abort();
            abortSignal.current = null;
        }

        const _abortSignal = new AbortController();
        abortSignal.current = _abortSignal;

        try {
            const params: any = {
                orderParam: sortBy,
                orderDescending: sortDescending,
                limit: props.itemsPerPage || 10
            };
            if(sortedData.current.endTime!=null) params.endTime = sortedData.current.endTime;
            if(props.additionalData!=null) {
                for(let key in props.additionalData) {
                    params[key] = props.additionalData[key];
                }
            }

            const httpResponse = await fetch(props.endpoint+"?"+Object.keys(params).map(e => e+"="+encodeURIComponent(""+params[e])).join("&"), {
                signal: _abortSignal.signal
            });

            if(httpResponse==null || httpResponse.status!==200) {
                throw new Error("Backend get response code not 200");
            }

            const obj = await httpResponse.json();
            const data = obj.data;

            if(props.dataPostProcessor!=null) {
                await props.dataPostProcessor(data);
            }

            sortedData.current.last = obj.last;
            sortedData.current.endTime = obj.last ? null : obj.endTime;

            sortedData.current.pages[page] = data;

            return {
                data: sortedData.current.pages[page],
                maxPages: sortedData.current.last ? sortedData.current.pages.length : sortedData.current.pages.length+1
            };
        } catch (e) {
            console.error(e);
        }

        return {
            data: [],
            maxPages: 1
        };

    }, [props.endpoint, props.additionalData, props.dataPostProcessor]);

    return (
        <ResponsiveTable getPage={memoizedGetter} refresh={tableRefreshRef} {...props}/>
    )
}
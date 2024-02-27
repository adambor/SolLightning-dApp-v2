import {ButtonGroup, Card, ListGroup, Spinner, Table} from "react-bootstrap";
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
        <Button onClick={() => {props.onClick(props.page)}} key={"page-"+props.page} variant={props.currentPage===props.page ? "light" : "outline-light"} disabled={props.disabled} className={"px-3"} size="lg">{props.page+1}</Button>
    );
}

type TableColumn = {
    renderer?: (any) => string | JSX.Element,
};

type GetPageResponse = {
    data: any[],
    maxPages: number
}

function SingleColumnTable(props : {
    className?: any,
    getPage: (page: number, pageSize: number) => (Promise<GetPageResponse> | GetPageResponse),
    itemsPerPage?: number,
    column: TableColumn,
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

    const itemsPerPage = props.itemsPerPage || 10;

    useEffect(() => {
        setState((val) => {
            return {...val, page: 0};
        });
    }, [props.getPage]);

    const renderFunc = () => {
        console.log("Table re-render: ", [state.page, props.getPage]);

        const maybePromise = props.getPage(state.page, itemsPerPage);

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

    useEffect(renderFunc, [state.page, props.getPage]);

    const tbody = [];

    for(let i=0;i<itemsPerPage;i++) {
        const obj = state.pageData[i];
        if(obj!=null) tbody.push((
            <ListGroup.Item className="bg-dark bg-opacity-25 border-light border-opacity-25 text-white">{props.column.renderer(obj)}</ListGroup.Item>
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
            <Button key={"ellipsis2"} variant="outline-light px-2" size="lg">...</Button>
        ));
    } else if((numPages-state.page-1)<(numPageButtons/2)) {
        for(let i=0;i<(numPageButtons/2)+1;i++) {
            buttons.push((
                <PaginationButton page={numPages-i-1} key={"page"+(numPages-i-1)} currentPage={state.page} onClick={handlePageClick} disabled={loading}/>
            ));
        }
        buttons.push((
            <Button key={"ellipsis1"} variant="outline-light px-2" size="lg">...</Button>
        ));
        buttons.reverse();
    } else {
        buttons.push((
            <Button key={"ellipsis1"} variant="outline-light px-2" size="lg">...</Button>
        ));
        for(let i=state.page-1;i<=state.page+1;i++) {
            buttons.push((
                <PaginationButton page={i} key={"page"+i}  currentPage={state.page} onClick={handlePageClick} disabled={loading}/>
            ));
        }
        buttons.push((
            <Button key={"ellipsis2"} variant="outline-light px-2" size="lg">...</Button>
        ));
    }

    return (
        <div>
            <div className="position-relative">
                <Card className="bg-transparent border-0">
                    <ListGroup variant="flush">
                        {tbody}
                    </ListGroup>
                </Card>
                {loading ? (
                    <div className="table-loading-pane d-flex align-items-center justify-content-center flex-column">
                    <Spinner animation="border" role="status"/>
                    <span>Loading...</span>
                    </div>
                ) : ""}
            </div>
            <div className="d-flex align-items-center justify-content-center mt-2 mb-4">
                <ButtonGroup className="bg-dark bg-opacity-25" aria-label="Second group">
                    <Button variant="outline-light px-2" onClick={() => handlePageClick(0)} size="lg" disabled={loading}><Icon size={20} style={{marginTop: "-8px"}} icon={angleDoubleLeft}/></Button>
                    <Button variant="outline-light px-2" onClick={() => handlePageClick(state.page-1)} size="lg" disabled={loading}><Icon size={20} style={{marginTop: "-8px"}} icon={angleLeft}/></Button>
                    {buttons}
                    <Button variant="outline-light px-2" onClick={() => handlePageClick(state.page+1)} size="lg" disabled={loading}><Icon size={20} style={{marginTop: "-8px"}} icon={angleRight}/></Button>
                    <Button variant="outline-light px-2" onClick={() => handlePageClick(numPages-1)} size="lg" disabled={loading}><Icon size={20} style={{marginTop: "-8px"}} icon={angleDoubleRight}/></Button>
                </ButtonGroup>
            </div>
        </div>
    );

}

export function SingleColumnBackendTable(props: {
    className?: any,
    itemsPerPage?: number,
    column: TableColumn,
    numPageButtons?: number,

    endpoint: string,
    additionalData?: any,
    dataPostProcessor?: (rows: any[]) => Promise<void>,
    refreshFunc?: MutableRefObject<() => void>
}) {

    const abortSignal = useRef<AbortController>(null);

    const sortedData = useRef<{
        pages: any[][],
        endTime: number,
        last: boolean,
        additionalData: any
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

    const memoizedGetter = useCallback(async (page: number, pageSize: number) => {
        if(sortedData.current==null || sortedData.current.additionalData!==props.additionalData) {
            sortedData.current = {
                pages: [],
                endTime: null,
                last: false,
                additionalData: props.additionalData
            };
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
        <SingleColumnTable getPage={memoizedGetter} refresh={tableRefreshRef} {...props}/>
    )
}
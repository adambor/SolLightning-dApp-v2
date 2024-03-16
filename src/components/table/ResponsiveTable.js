import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ButtonGroup, Spinner, Table } from "react-bootstrap";
import * as React from "react";
import { useCallback, useEffect, useRef } from "react";
import Button from "react-bootstrap/Button";
import { Icon } from "react-icons-kit";
import { caretUp } from 'react-icons-kit/fa/caretUp';
import { caretDown } from 'react-icons-kit/fa/caretDown';
import { angleRight } from 'react-icons-kit/fa/angleRight';
import { angleLeft } from 'react-icons-kit/fa/angleLeft';
import { angleDoubleRight } from 'react-icons-kit/fa/angleDoubleRight';
import { angleDoubleLeft } from 'react-icons-kit/fa/angleDoubleLeft';
function PaginationButton(props) {
    return (_jsx(Button, { onClick: () => { props.onClick(props.page); }, variant: props.currentPage === props.page ? "info" : "outline-secondary", disabled: props.disabled, className: "px-3 " + (props.currentPage === props.page ? "text-white" : "text-dark"), size: "lg", children: props.page + 1 }, "page-" + props.page));
}
function ResponsiveTable(props) {
    const [state, setState] = React.useState({
        page: 0,
        sortedBy: null,
        sortedDescending: false,
        pageData: [],
        maxPages: 0,
        loading: false
    });
    const loading = props.loading || state.loading;
    const sortBy = state.sortedBy || props.defaultSortedBy;
    const sortDescending = state.sortedBy == null ? props.defaultSortedDescending : state.sortedDescending;
    const itemsPerPage = props.itemsPerPage || 10;
    const renderFunc = () => {
        console.log("Table re-render: ", [sortBy, sortDescending, state.page, props.getPage]);
        const maybePromise = props.getPage(state.page, itemsPerPage, sortBy, sortDescending);
        if (maybePromise instanceof Promise) {
            setState((val) => {
                return { ...val, loading: true };
            });
            maybePromise.then((obj) => {
                setState((val) => {
                    return { ...val, maxPages: obj.maxPages, pageData: obj.data, loading: false };
                });
            });
        }
        else {
            setState((val) => {
                return { ...val, maxPages: maybePromise.maxPages, pageData: maybePromise.data };
            });
        }
    };
    if (props.refresh != null)
        props.refresh.current = renderFunc;
    useEffect(renderFunc, [sortBy, sortDescending, state.page, props.getPage]);
    const thead = [];
    for (let column of props.columns) {
        if (column.sortable) {
            thead.push((_jsx("th", { style: {
                    width: column.minWidth,
                    maxWidth: column.maxWidth
                }, className: "px-3 py-2 cursor-pointer", onClick: () => {
                    setState((val) => {
                        const sortBy = state.sortedBy || props.defaultSortedBy;
                        const sortDescending = state.sortedBy == null ? props.defaultSortedDescending : state.sortedDescending;
                        if (sortBy === column.accessor) {
                            return { ...val, sortedBy: column.accessor, sortedDescending: !sortDescending, page: 0 };
                        }
                        else {
                            return { ...val, sortedBy: column.accessor, sortedDescending: false, page: 0 };
                        }
                    });
                }, children: _jsxs("div", { className: "d-flex align-items-center", children: [column.header, _jsxs("div", { className: "d-inline-flex flex-column ms-auto", children: [_jsx(Icon, { icon: caretUp, className: (sortBy === column.accessor && !sortDescending ? "text-primary" : "") + " square16", style: {
                                        marginBottom: "-4px",
                                        marginTop: "-4px"
                                    } }), _jsx(Icon, { icon: caretDown, className: (sortBy === column.accessor && sortDescending ? "text-primary" : "") + " square16", style: {
                                        marginBottom: "0px",
                                        marginTop: "-4px"
                                    } })] })] }) }, column.accessor)));
        }
        else {
            thead.push((_jsx("th", { className: "px-3 py-2", style: {
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth
                }, children: column.header }, column.accessor)));
        }
    }
    const tbody = [];
    for (let i = 0; i < itemsPerPage; i++) {
        const row = [];
        const obj = state.pageData[i];
        for (let column of props.columns) {
            let additionalProps = {};
            if (obj != null && props.getTdProps != null) {
                const addProps = props.getTdProps(obj, column.accessor);
                if (addProps != null)
                    additionalProps = addProps;
            }
            row.push((_jsx("td", { className: "px-3 py-2", style: {
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth
                }, ...additionalProps, children: obj == null ? "" : column.renderer != null ? column.renderer(obj) : obj[column.accessor] }, column.accessor)));
        }
        tbody.push((_jsx("tr", { children: row }, i)));
    }
    const numPageButtons = props.numPageButtons || 5;
    const buttons = [];
    const numPages = state.maxPages;
    const handlePageClick = (page) => {
        if (page < 0)
            return;
        if (page > numPages - 1)
            return;
        setState((val) => { return { ...val, page: page }; });
    };
    if (numPages <= numPageButtons) {
        for (let i = 0; i < numPages; i++) {
            buttons.push((_jsx(PaginationButton, { page: i, currentPage: state.page, onClick: handlePageClick, disabled: loading }, "page" + i)));
        }
    }
    else if (state.page < (numPageButtons / 2)) {
        for (let i = 0; i < (numPageButtons / 2) + 1; i++) {
            buttons.push((_jsx(PaginationButton, { page: i, currentPage: state.page, onClick: handlePageClick, disabled: loading }, "page" + i)));
        }
        buttons.push((_jsx(Button, { variant: "outline-secondary text-dark px-3", size: "lg", children: "..." }, "ellipsis2")));
    }
    else if ((numPages - state.page - 1) < (numPageButtons / 2)) {
        for (let i = 0; i < (numPageButtons / 2) + 1; i++) {
            buttons.push((_jsx(PaginationButton, { page: numPages - i - 1, currentPage: state.page, onClick: handlePageClick, disabled: loading }, "page" + (numPages - i - 1))));
        }
        buttons.push((_jsx(Button, { variant: "outline-secondary text-dark px-3", size: "lg", children: "..." }, "ellipsis1")));
        buttons.reverse();
    }
    else {
        buttons.push((_jsx(Button, { variant: "outline-secondary text-dark px-3", size: "lg", children: "..." }, "ellipsis1")));
        for (let i = state.page - 1; i <= state.page + 1; i++) {
            buttons.push((_jsx(PaginationButton, { page: i, currentPage: state.page, onClick: handlePageClick, disabled: loading }, "page" + i)));
        }
        buttons.push((_jsx(Button, { variant: "outline-secondary text-dark px-3", size: "lg", children: "..." }, "ellipsis2")));
    }
    return (_jsxs("div", { children: [_jsxs("div", { className: "position-relative", children: [_jsxs(Table, { responsive: true, className: "hopa-table", children: [_jsx("thead", { children: _jsx("tr", { children: thead }) }), _jsx("tbody", { className: "", children: tbody })] }), loading ? (_jsxs("div", { className: "table-loading-pane d-flex align-items-center justify-content-center flex-column text-black", children: [_jsx(Spinner, { animation: "border", role: "status" }), _jsx("span", { children: "Loading..." })] })) : ""] }), _jsx("div", { className: "d-flex", children: _jsxs(ButtonGroup, { className: "ms-auto ", "aria-label": "Second group", children: [_jsx(Button, { variant: "outline-secondary text-dark px-3", onClick: () => handlePageClick(0), size: "lg", disabled: loading, children: _jsx(Icon, { icon: angleDoubleLeft }) }), _jsx(Button, { variant: "outline-secondary text-dark px-3", onClick: () => handlePageClick(state.page - 1), size: "lg", disabled: loading, children: _jsx(Icon, { icon: angleLeft }) }), buttons, _jsx(Button, { variant: "outline-secondary text-dark px-3", onClick: () => handlePageClick(state.page + 1), size: "lg", disabled: loading, children: _jsx(Icon, { icon: angleRight }) }), _jsx(Button, { variant: "outline-secondary text-dark px-3", onClick: () => handlePageClick(numPages - 1), size: "lg", disabled: loading, children: _jsx(Icon, { icon: angleDoubleRight }) })] }) })] }));
}
export function StaticDataTable(props) {
    const sortedData = useRef(null);
    const pageCbk = useCallback(async (page, pageSize, sortBy, sortDescending) => {
        console.log("Page cbk called: " + page + " " + pageSize + " " + sortBy + " " + sortDescending);
        console.log("Page cbk , sortedData current: ", sortedData.current);
        if (sortedData.current != null && sortedData.current.initialData !== props.data)
            sortedData.current = null;
        if (sortedData.current == null) {
            sortedData.current = {
                initialData: props.data,
                data: sortBy != null ? [...props.data].sort((a, b) => {
                    return ("" + a[sortBy]).localeCompare(b[sortBy]) * (sortDescending ? -1 : 1);
                }) : [...props.data],
                sortBy,
                sortDescending
            };
        }
        else {
            if (sortedData.current.sortBy !== sortBy || sortedData.current.sortDescending !== sortDescending) {
                sortedData.current = {
                    initialData: props.data,
                    data: sortBy != null ? [...props.data].sort((a, b) => {
                        return ("" + a[sortBy]).localeCompare(b[sortBy]) * (sortDescending ? -1 : 1);
                    }) : [...props.data],
                    sortBy,
                    sortDescending
                };
            }
        }
        await new Promise((resolve) => { setTimeout(resolve, 250); });
        console.log("Page cbk return: ", sortedData.current.data.slice(page * pageSize, (page + 1) * pageSize));
        return {
            data: sortedData.current.data.slice(page * pageSize, (page + 1) * pageSize),
            maxPages: Math.ceil(sortedData.current.data.length / pageSize)
        };
    }, [props.data]);
    return (_jsx(ResponsiveTable, { getPage: pageCbk, ...props }));
}
export function BackendDataTable(props) {
    const abortSignal = useRef(null);
    const topicSubscription = useRef(null);
    const sortedData = useRef(null);
    const tableRefreshRef = useRef();
    if (props.refreshFunc != null)
        props.refreshFunc.current = () => {
            sortedData.current = null;
            if (tableRefreshRef.current != null)
                tableRefreshRef.current();
        };
    useEffect(() => {
        return () => {
            if (abortSignal.current != null) {
                abortSignal.current.abort();
                abortSignal.current = null;
            }
        };
    }, []);
    const memoizedGetter = useCallback(async (page, pageSize, sortBy, sortDescending) => {
        if (sortedData.current == null) {
            sortedData.current = {
                pages: [],
                sortBy,
                sortDescending,
                endTime: null,
                last: false
            };
        }
        else {
            if (sortedData.current.sortBy !== sortBy || sortedData.current.sortDescending !== sortDescending) {
                sortedData.current = {
                    pages: [],
                    sortBy,
                    sortDescending,
                    endTime: null,
                    last: false
                };
            }
        }
        if (sortedData.current.pages[page] != null)
            return {
                data: sortedData.current.pages[page],
                maxPages: sortedData.current.last ? sortedData.current.pages.length : sortedData.current.pages.length + 1
            };
        if (abortSignal.current != null) {
            abortSignal.current.abort();
            abortSignal.current = null;
        }
        const _abortSignal = new AbortController();
        abortSignal.current = _abortSignal;
        try {
            const params = {
                orderParam: sortBy,
                orderDescending: sortDescending,
                limit: props.itemsPerPage || 10
            };
            if (sortedData.current.endTime != null)
                params.endTime = sortedData.current.endTime;
            if (props.additionalData != null) {
                for (let key in props.additionalData) {
                    params[key] = props.additionalData[key];
                }
            }
            const httpResponse = await fetch(props.endpoint + "?" + Object.keys(params).map(e => e + "=" + encodeURIComponent("" + params[e])).join("&"), {
                signal: _abortSignal.signal
            });
            if (httpResponse == null || httpResponse.status !== 200) {
                throw new Error("Backend get response code not 200");
            }
            const obj = await httpResponse.json();
            const data = obj.data;
            if (props.dataPostProcessor != null) {
                await props.dataPostProcessor(data);
            }
            sortedData.current.last = obj.last;
            sortedData.current.endTime = obj.last ? null : obj.endTime;
            sortedData.current.pages[page] = data;
            return {
                data: sortedData.current.pages[page],
                maxPages: sortedData.current.last ? sortedData.current.pages.length : sortedData.current.pages.length + 1
            };
        }
        catch (e) {
            console.error(e);
        }
        return {
            data: [],
            maxPages: 1
        };
    }, [props.endpoint, props.additionalData, props.dataPostProcessor]);
    return (_jsx(ResponsiveTable, { getPage: memoizedGetter, refresh: tableRefreshRef, ...props }));
}

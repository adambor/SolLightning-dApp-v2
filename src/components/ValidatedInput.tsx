import {Form, InputGroup, OverlayTrigger, Tooltip} from "react-bootstrap";
import * as React from "react";
import {useRef} from "react";
import BigNumber from "bignumber.js";

import {copy} from 'react-icons-kit/fa/copy';
import {exclamationTriangle} from 'react-icons-kit/fa/exclamationTriangle'
import Icon from "react-icons-kit";

export type ValidatedInputRef = {
    validate: () => boolean,
    getValue: () => any,
    input: {
        current: HTMLInputElement
    }
}

const numberValidator = (value, props) => {
    if(value!=="") {
        try {
            const number = new BigNumber(value);
            if(props.min!=null) {
                if(number.comparedTo(props.min)<0) return "Must be at least "+props.min.toString(10);
            }
            if(props.max!=null) {
                if(number.comparedTo(props.max)>0) return "Must be at most "+props.max.toString(10);
            }
            if(number.isNaN()) return "Not a number";
        } catch (e) {
            return "Not a number";
        }
    }
};

function ValidatedInput(props : {
    className?: any,
    inputRef?: {
        current?: ValidatedInputRef
    },

    onSubmit?: Function,
    onChange?: Function,
    onValidate?: (val: any) => string,
    defaultValue?: any,
    placeholder?: any,
    type?: string,
    label?: string | JSX.Element,
    value?: any,

    min?: BigNumber,
    max?: BigNumber,
    step?: BigNumber,

    copyEnabled?: boolean,

    options?: {key: string, value: any}[],

    size?: "sm" | "lg",

    elementEnd?: string | JSX.Element,
    textEnd?: string | JSX.Element,
    elementStart?: string | JSX.Element,
    textStart?: string | JSX.Element,

    disabled?: boolean,
    validated?: string,
    readOnly?: boolean
}) {

    const [state, setState] = React.useState<{value: string, validated: string}>({
        value: "",
        validated: null
    });

    const inputRef = useRef<HTMLInputElement>(null);
    const inputTextAreaRef = useRef<HTMLTextAreaElement>(null);

    let refObj;
    refObj = {
        validate: (): boolean => {
            let validated: string = null;
            if (props.type === "number") {
                validated = numberValidator(props.value==null ? state.value : props.value, props);
            }
            if (validated == null) if (props.onValidate != null) {
                validated = props.onValidate(props.value==null ? state.value : props.value);
            }
            setState(initial => {
                return {...initial, validated}
            });
            return validated == null;

        },
        getValue: () => {
            return props.value==null ? (state.value==="" ? props.defaultValue : state.value) : props.value;
        },
        input: props.type==="textarea" ? inputTextAreaRef : inputRef
    };

    if(props.inputRef!=null) {
        props.inputRef.current = refObj;
    }

    return (
        <Form className={props.className} onSubmit={(evnt) => {
            evnt.preventDefault();
            if(props.onSubmit!=null) props.onSubmit();
        }}>
            <Form.Group controlId="validationCustom01">
                {props.label ? (<Form.Label>{props.label}</Form.Label>) : ""}
                <InputGroup>
                    {props.type==="checkbox" ? (
                        <Form.Check
                            disabled={props.disabled}
                            ref={inputRef}
                            isInvalid={!!(props.validated || state.validated)}
                            type={"checkbox"}
                            readOnly={props.readOnly}
                            label={props.placeholder}
                            defaultValue={props.defaultValue}
                            onChange={(evnt: any) => {
                                const obj: any = {};
                                if(props.onValidate!=null) {
                                    obj.validated = props.onValidate(evnt.target.checked);
                                }
                                obj.value = evnt.target.checked;
                                setState(obj);
                                if(props.onChange!=null) props.onChange(evnt.target.checked);
                            }}
                            checked={props.value==null ? (state.value==="" ? props.defaultValue : state.value) : props.value}
                        />
                    ) : props.type==="select" ? (
                        <>
                            {props.elementStart || ""}
                            {props.textStart ? (
                                <InputGroup.Text>
                                    {props.textStart}
                                </InputGroup.Text>
                            ) : ""}
                            <Form.Select
                                disabled={props.disabled}
                                isInvalid={!!(props.validated || state.validated)}
                                defaultValue={props.defaultValue}
                                size={props.size}
                                onChange={(evnt: any) => {
                                    const obj: any = {};
                                    if(props.onValidate!=null) {
                                        obj.validated = props.onValidate(evnt.target.value);
                                    }
                                    obj.value = evnt.target.value;
                                    setState(obj);
                                    if(props.onChange!=null) props.onChange(evnt.target.value);
                                }}
                                value={props.value==null ? state.value : props.value}
                            >
                                {props.options==null ? "" : props.options.map((e) => {
                                    return (<option key={e.key} value={e.key}>{e.value}</option>)
                                })}
                            </Form.Select>
                            {props.elementEnd || ""}
                            {props.textEnd ? (
                                <InputGroup.Text>
                                    {props.textEnd}
                                </InputGroup.Text>
                            ) : ""}
                        </>
                    ) : props.type==="textarea" ? (
                        <>
                            {props.elementStart || ""}
                            {props.textStart ? (
                                <InputGroup.Text>
                                    {props.textStart}
                                </InputGroup.Text>
                            ) : ""}
                            <Form.Control
                                readOnly={props.readOnly}
                                disabled={props.disabled}
                                ref={inputTextAreaRef}
                                size={props.size}
                                isInvalid={!!(props.validated || state.validated)}
                                type={props.type || "text"}
                                as={"textarea"}
                                placeholder={props.placeholder}
                                defaultValue={props.defaultValue}
                                onChange={(evnt: any) => {
                                    const obj: any = {};
                                    if(props.type==="number") {
                                        obj.validated = numberValidator(evnt.target.value, props);
                                    }
                                    if(obj.validated==null) if(props.onValidate!=null) {
                                        obj.validated = props.onValidate(evnt.target.value);
                                    }
                                    obj.value = evnt.target.value;
                                    setState(obj);
                                    if(props.onChange!=null) props.onChange(evnt.target.value);
                                }}
                                value={props.value==null ? state.value : props.value}
                            />
                            {props.copyEnabled ? (
                                <InputGroup.Text>
                                    <OverlayTrigger
                                        placement="top"
                                        overlay={<Tooltip id="copy-tooltip">Copy</Tooltip>}
                                    >
                                        <a href="#" onClick={(e) => {
                                            e.preventDefault();
                                            refObj.input.current.select();
                                            refObj.input.current.setSelectionRange(0, 99999);
                                            // @ts-ignore
                                            navigator.clipboard.writeText(refObj.input.current.value);
                                        }}><Icon icon={copy}/></a>
                                    </OverlayTrigger>
                                </InputGroup.Text>
                            ) : ""}
                            {props.elementEnd || ""}
                            {props.textEnd ? (
                                <InputGroup.Text>
                                    {props.textEnd}
                                </InputGroup.Text>
                            ) : ""}
                        </>
                    ) : (
                        <>
                            {props.elementStart || ""}
                            {props.textStart ? (
                                <InputGroup.Text>
                                    {props.textStart}
                                </InputGroup.Text>
                            ) : ""}
                            <Form.Control
                                readOnly={props.readOnly}
                                disabled={props.disabled}
                                ref={inputRef}
                                size={props.size}
                                isInvalid={!!(props.validated || state.validated)}
                                type={props.type || "text"}
                                placeholder={props.placeholder}
                                defaultValue={props.defaultValue}
                                onChange={(evnt: any) => {
                                    const obj: any = {};
                                    if(props.type==="number") {
                                        obj.validated = numberValidator(evnt.target.value, props);
                                    }
                                    if(obj.validated==null) if(props.onValidate!=null) {
                                        obj.validated = props.onValidate(evnt.target.value);
                                    }
                                    obj.value = evnt.target.value;
                                    setState(obj);
                                    if(props.onChange!=null) props.onChange(evnt.target.value);
                                }}
                                min={props.min!=null ? props.min.toString(10): null}
                                max={props.max!=null ? props.max.toString(10): null}
                                step={props.step!=null ? props.step.toString(10): null}
                                value={props.value==null ? state.value : props.value}
                            />
                            {props.copyEnabled ? (
                                <InputGroup.Text>
                                    <OverlayTrigger
                                        placement="top"
                                        overlay={<Tooltip id="copy-tooltip">Copy</Tooltip>}
                                    >
                                        <a href="#" onClick={(e) => {
                                            e.preventDefault();
                                            refObj.input.current.select();
                                            refObj.input.current.setSelectionRange(0, 99999);
                                            // @ts-ignore
                                            navigator.clipboard.writeText(refObj.input.current.value);
                                        }}><Icon icon={copy}/></a>
                                    </OverlayTrigger>
                                </InputGroup.Text>
                            ) : ""}
                            {props.elementEnd || ""}
                            {props.textEnd ? (
                                <InputGroup.Text>
                                    {props.textEnd}
                                </InputGroup.Text>
                            ) : ""}
                        </>
                    )}
                    <Form.Control.Feedback type="invalid"><Icon icon={exclamationTriangle}/> {props.validated || state.validated}</Form.Control.Feedback>
                </InputGroup>
            </Form.Group>
        </Form>
    );

}

export default ValidatedInput;
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Form, InputGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import * as React from "react";
import { useRef } from "react";
import BigNumber from "bignumber.js";
import { copy } from 'react-icons-kit/fa/copy';
import { exclamationTriangle } from 'react-icons-kit/fa/exclamationTriangle';
import Icon from "react-icons-kit";
const numberValidator = (value, props) => {
    if (value !== "") {
        try {
            const number = new BigNumber(value);
            if (props.min != null) {
                if (number.comparedTo(props.min) < 0)
                    return "Must be at least " + props.min.toString(10);
            }
            if (props.max != null) {
                if (number.comparedTo(props.max) > 0)
                    return "Must be at most " + props.max.toString(10);
            }
            if (number.isNaN())
                return "Not a number";
        }
        catch (e) {
            return "Not a number";
        }
    }
};
function ValidatedInput(props) {
    const [state, setState] = React.useState({
        value: "",
        validated: null
    });
    const inputRef = useRef(null);
    const inputTextAreaRef = useRef(null);
    let refObj;
    refObj = {
        validate: () => {
            let validated = null;
            if (props.type === "number") {
                validated = numberValidator(props.value == null ? state.value : props.value, props);
            }
            if (validated == null)
                if (props.onValidate != null) {
                    validated = props.onValidate(props.value == null ? state.value : props.value);
                }
            setState(initial => {
                return Object.assign(Object.assign({}, initial), { validated });
            });
            return validated == null;
        },
        getValue: () => {
            return props.value == null ? (state.value === "" ? props.defaultValue : state.value) : props.value;
        },
        input: props.type === "textarea" ? inputTextAreaRef : inputRef
    };
    if (props.inputRef != null) {
        props.inputRef.current = refObj;
    }
    const inputClassName = (props.inputClassName || "")
        + " "
        + (props.floatingLabel != null ? "input-with-offset" : props.expectingFloatingLabel ? "py-expect-floating-label" : "");
    const mainElement = props.type === "select" ? (_jsx(Form.Select, Object.assign({ disabled: props.disabled, isInvalid: !!(props.validated || state.validated), defaultValue: props.defaultValue, size: props.size, id: props.inputId, onChange: (evnt) => {
            const obj = {};
            if (props.onValidate != null) {
                obj.validated = props.onValidate(evnt.target.value);
            }
            obj.value = evnt.target.value;
            setState(obj);
            if (props.onChange != null)
                props.onChange(evnt.target.value);
        }, value: props.value == null ? state.value : props.value, className: inputClassName }, { children: props.options == null ? "" : props.options.map((e) => {
            return (_jsx("option", Object.assign({ value: e.key }, { children: e.value }), e.key));
        }) }))) : props.type === "textarea" ? (_jsxs(_Fragment, { children: [_jsx(Form.Control, { readOnly: props.readOnly, disabled: props.disabled, ref: inputTextAreaRef, size: props.size, isInvalid: !!(props.validated || state.validated), type: props.type || "text", as: "textarea", placeholder: props.placeholder, defaultValue: props.defaultValue, id: props.inputId, onChange: (evnt) => {
                    const obj = {};
                    if (props.type === "number") {
                        obj.validated = numberValidator(evnt.target.value, props);
                    }
                    if (obj.validated == null)
                        if (props.onValidate != null) {
                            obj.validated = props.onValidate(evnt.target.value);
                        }
                    obj.value = evnt.target.value;
                    setState(obj);
                    if (props.onChange != null)
                        props.onChange(evnt.target.value);
                }, value: props.value == null ? state.value : props.value, className: inputClassName }), props.copyEnabled ? (_jsx(InputGroup.Text, { children: _jsx(OverlayTrigger, Object.assign({ placement: "top", overlay: _jsx(Tooltip, Object.assign({ id: "copy-tooltip" }, { children: "Copy" })) }, { children: _jsx("a", Object.assign({ href: "#", onClick: (e) => {
                            e.preventDefault();
                            refObj.input.current.select();
                            refObj.input.current.setSelectionRange(0, 99999);
                            // @ts-ignore
                            navigator.clipboard.writeText(refObj.input.current.value);
                        } }, { children: _jsx(Icon, { icon: copy }) })) })) })) : ""] })) : (_jsxs(_Fragment, { children: [_jsx(Form.Control, { readOnly: props.readOnly, disabled: props.disabled, ref: inputRef, size: props.size, isInvalid: !!(props.validated || state.validated), type: props.type || "text", placeholder: props.placeholder, defaultValue: props.defaultValue, id: props.inputId, onChange: (evnt) => {
                    const obj = {};
                    if (props.type === "number") {
                        obj.validated = numberValidator(evnt.target.value, props);
                    }
                    if (obj.validated == null)
                        if (props.onValidate != null) {
                            obj.validated = props.onValidate(evnt.target.value);
                        }
                    obj.value = evnt.target.value;
                    setState(obj);
                    if (props.onChange != null)
                        props.onChange(evnt.target.value);
                }, min: props.min != null ? props.min.toString(10) : null, max: props.max != null ? props.max.toString(10) : null, step: props.step != null ? props.step.toString(10) : null, value: props.value == null ? state.value : props.value, className: inputClassName }), props.copyEnabled ? (_jsx(InputGroup.Text, { children: _jsx(OverlayTrigger, Object.assign({ placement: "top", overlay: _jsx(Tooltip, Object.assign({ id: "copy-tooltip" }, { children: "Copy" })) }, { children: _jsx("a", Object.assign({ href: "#", className: "d-flex align-items-center justify-content-center", onClick: (e) => {
                            e.preventDefault();
                            refObj.input.current.select();
                            refObj.input.current.setSelectionRange(0, 99999);
                            // @ts-ignore
                            navigator.clipboard.writeText(refObj.input.current.value);
                        } }, { children: _jsx(Icon, { style: { marginTop: "-4px" }, icon: copy }) })) })) })) : ""] }));
    return (_jsx(Form, Object.assign({ className: props.className, onSubmit: (evnt) => {
            evnt.preventDefault();
            if (props.onSubmit != null)
                props.onSubmit();
        } }, { children: _jsxs(Form.Group, Object.assign({ controlId: props.inputId == null ? "validationCustom01" : undefined }, { children: [props.label ? (_jsx(Form.Label, { children: props.label })) : "", _jsxs(InputGroup, Object.assign({ className: "has-validation " + (props.floatingLabel != null || props.expectingFloatingLabel ? "form-floating" : "") }, { children: [props.type === "checkbox" ? (_jsx(Form.Check, { disabled: props.disabled, ref: inputRef, isInvalid: !!(props.validated || state.validated), type: "checkbox", readOnly: props.readOnly, label: props.placeholder, defaultValue: props.defaultValue, id: props.inputId, onChange: (evnt) => {
                                const obj = {};
                                if (props.onValidate != null) {
                                    obj.validated = props.onValidate(evnt.target.checked);
                                }
                                obj.value = evnt.target.checked;
                                setState(obj);
                                if (props.onChange != null)
                                    props.onChange(evnt.target.checked);
                            }, checked: props.value == null ? (state.value === "" ? props.defaultValue : state.value) : props.value })) : (_jsxs(_Fragment, { children: [props.elementStart || "", props.textStart ? (_jsx(InputGroup.Text, { children: props.textStart })) : "", mainElement, props.floatingLabel == null ? "" : _jsx("label", { children: props.floatingLabel }), props.elementEnd || "", props.textEnd ? (_jsx(InputGroup.Text, { children: props.textEnd })) : ""] })), _jsx(Form.Control.Feedback, Object.assign({ type: "invalid" }, { children: _jsxs("div", Object.assign({ className: "d-flex align-items-center" }, { children: [_jsx(Icon, { className: "mb-1 me-1", icon: exclamationTriangle }), _jsx("span", { children: props.validated || state.validated })] })) }))] }))] })) })));
}
export default ValidatedInput;

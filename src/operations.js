import morphdom from 'morphdom';

const selectAll = (operation, callbackfn) => {
    const prevFocusElement = document.activeElement;
    const elements = document.querySelectorAll(operation.selector);
    elements.forEach(el => el && callbackfn(el, operation.value));
    const currFocusElement = document.activeElement;
    if (prevFocusElement && prevFocusElement.focus && prevFocusElement !== currFocusElement) {
        prevFocusElement.focus();
    }
}

export default {
    // element mutations
    dataset: operation => selectAll(operation, (el, value) => {
        for (const k in value) {
            el.dataset[k] = value[k]
        }
    }),
    setAttributes: operation => selectAll(operation, (el, value) => {
        for (const k in value) {
            el.setAttribute(k, value[k])
        }
    }),
    removeAttributes: operation => selectAll(operation, (el, value) => {
        value.forEach(k => el.removeAttribute(k))
    }),
    properties: operation => selectAll(operation, (el, value) => {
        for (const k in value) {
            if (k in el) el[k] = value[k]
        }
    }),
    classlist: operation => selectAll(operation, (el, value) => {
        for (const k in value) {
            const enabled = value[k];
            if (enabled) {
                el.classList.add(k);
            } else {
                el.classList.remove(k);
            }
        }
    }),
    styles: operation => selectAll(operation, (el, value) => {
        for (const k in value) {
            el.style[k] = value[k]
        }
    }),
    value: operation => selectAll(operation, (el, value) => {
        el.value = value;
    }),
    // dom mutations
    morph: operation => selectAll(operation, (el, value) => {
        morphdom(el, value, morphOptions)
    }),
    focus: operation => {
        const el = document.querySelector(operation.selector);
        if (el && el.focus) {
            el.focus();
        }
    },
    // browser
    reload: operation => window.location.reload()
}


const morphOptions = {
    onBeforeElUpdated: function (fromEl, toEl) {
        // spec - https://dom.spec.whatwg.org/#concept-node-equals
        if (fromEl.isEqualNode(toEl)) {
            return false
        }

        return true
    },
    childrenOnly: false,
}
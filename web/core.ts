export type ValueOf<T> = T[keyof T]
export type HTMLElementTypes = ValueOf<HTMLElementTagNameMap>
export type DynamicMantleNodeType = MantleNode<HTMLElementTypes>
export type MantleTagType = keyof HTMLElementTagNameMap
export type MantleChildren = (DynamicMantleNodeType|HTMLElementTypes|Function|string)[]

export class MantleNode<HTMLElementType extends HTMLElementTypes>{
    attr: Object = {}
    element: HTMLElementType
    singeltons: HTMLElementTypes[]

    public AllowUnsafeHTML:boolean = false

    constructor(public tag: MantleTagType, children:MantleChildren = [], attr: Object = {}) { 
        this.element = document.createElement(tag) as HTMLElementType

        this.AppendChildren(children)
        
        if (Array.isArray(attr)) this.UpdateAttributes({class: attr})
        else this.UpdateAttributes(attr)
    }

    SetAttributes(attr: Object) {
        this.ClearAttributes()
        this.attr = {}

        for (var key in attr) {
            const CunstomAttribute = CustomAttributeMap[key]
            const value = CunstomAttribute ? CunstomAttribute(attr[key], this) : attr[key]
            if (!value) continue
            else this.element.setAttribute(key, value)
        }
        this.attr = attr
    }

    UpdateAttributes(attr: Object) {
        for (var key in attr) {
            const CunstomAttribute = CustomAttributeMap[key]
            const value = CunstomAttribute ? CunstomAttribute(attr[key], this) : attr[key]
            if (!value) continue
            else this.element.setAttribute(key, value)
        }
        this.attr = attr
    }

    AppendChildren(children: MantleChildren) {
        for (var child of children){
            if (typeof child === "string") {this.AppendString(child)}

            else if (child instanceof Function && child[SingelFunctionIdentifier]) {
                this.AppendMantleNode(child[SingelFunctionIdentifier])
            }
            else if (child instanceof MantleNode) {
                this.AppendMantleNode(child)
            }
            else if (child instanceof HTMLElement) {
                this.AppendHTMLElement(child)
            }
        }
    }

    SetChildren(children: MantleChildren) {
        this.ClearChildren()
        this.AppendChildren(children)
    }

    AppendMantleNode(node: DynamicMantleNodeType){
        this.element.appendChild(node.element)
    }

    AppendHTMLElement(element: HTMLElement) {
        this.element.appendChild(element)
    }

    AppendString(str: string) {
        if (this.AllowUnsafeHTML) this.element.innerHTML += str
        else this.element.innerText += str
    }

    //? Utility functions
    compare(node: MantleNode<HTMLElementType>): boolean {
        if (this.tag != node.tag) return false
        if (JSON.stringify(this.attr) != JSON.stringify(node.attr)) return false
        return true
    }

    ClearChildren(){
        this.element.innerHTML = ""
    }

    ClearAttributes() {
        while (this.element.attributes.length > 0) {
            this.element.removeAttribute(this.element.attributes[0].name);
        }
    }

    clear() {
        this.ClearChildren()
        this.ClearAttributes()
    }

    destroy() {
        this.element.remove()
        this.clear()
    }
}

const SingelFunctionIdentifier = "_SignalElementUUID_"

export function $singel<SingeltonType extends (... args: any[]) => DynamicMantleNodeType>(func:SingeltonType, initial:DynamicMantleNodeType) {
    var current = initial

    const update = (...args:Parameters<SingeltonType>):DynamicMantleNodeType => {
        const update = func(...args)

        if (current.compare(update)) {
            current.element.replaceWith(update.element)
            current.destroy()
            current = update
        } else {
            current.element.parentElement.replaceChild(update.element,current.element)
            current.destroy()
            current = update
        }
        return initial
    }

    update[SingelFunctionIdentifier] = current
    return update
}

export function $<K extends keyof HTMLElementTagNameMap>(tag: K, children:MantleChildren = [], attr: Object = {}): MantleNode<HTMLElementTagNameMap[K]>{
    return new MantleNode(tag, children, attr)
}

export function $escape(str: string): string {
    return str         
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

const FunctionAttribute = (attr) => (value, element:DynamicMantleNodeType) => {
    if (value instanceof Function) element.element[attr] = (...args) => {value(element, ...args)}
    else return value
}

const CustomAttributeMap = {
    style(value) {
        if (value instanceof Object){
            var style = ""
            for (var key in value){
                style += `${key}:${value[key]};`
            }
            return style

        } else return value
    },

    class(value) {
        if (value instanceof Array) return value.join(" ")
        else return value
    },

    onabort: FunctionAttribute("onabort"),
    onafterprint: FunctionAttribute("onafterprint"),
    onbeforeprint: FunctionAttribute("onbeforeprint"),
    onbeforeunload: FunctionAttribute("onbeforeunload"),
    onblur: FunctionAttribute("onblur"),
    oncanplay: FunctionAttribute("oncanplay"),
    oncanplaythrough: FunctionAttribute("oncanplaythrough"),
    onchange: FunctionAttribute("onchange"),
    onclick: FunctionAttribute("onclick"),
    oncontextmenu: FunctionAttribute("oncontextmenu"),
    oncopy: FunctionAttribute("oncopy"),
    oncuechange: FunctionAttribute("oncuechange"),
    oncut: FunctionAttribute("oncut"),
    ondblclick: FunctionAttribute("ondblclick"),
    ondrag: FunctionAttribute("ondrag"),
    ondragend: FunctionAttribute("ondragend"),
    ondragenter: FunctionAttribute("ondragenter"),
    ondragleave: FunctionAttribute("ondragleave"),
    ondragover: FunctionAttribute("ondragover"),
    ondragstart: FunctionAttribute("ondragstart"),
    ondrop: FunctionAttribute("ondrop"),
    ondurationchange: FunctionAttribute("ondurationchange"),
    onemptied: FunctionAttribute("onemptied"),
    onended: FunctionAttribute("onended"),
    onerror: FunctionAttribute("onerror"),
    onfocus: FunctionAttribute("onfocus"),
    onhashchange: FunctionAttribute("onhashchange"),
    oninput: FunctionAttribute("oninput"),
    oninvalid: FunctionAttribute("oninvalid"),
    onkeydown: FunctionAttribute("onkeydown"),
    onkeypress: FunctionAttribute("onkeypress"),
    onkeyup: FunctionAttribute("onkeyup"),
    onload: FunctionAttribute("onload"),
    onloadeddata: FunctionAttribute("onloadeddata"),
    onloadedmetadata: FunctionAttribute("onloadedmetadata"),
    onloadstart: FunctionAttribute("onloadstart"),
    onmousedown: FunctionAttribute("onmousedown"),
    onmousemove: FunctionAttribute("onmousemove"),
    onmouseout: FunctionAttribute("onmouseout"),
    onmouseover: FunctionAttribute("onmouseover"),
    onmouseup: FunctionAttribute("onmouseup"),
    onmousewheel: FunctionAttribute("onmousewheel"),
    onoffline: FunctionAttribute("onoffline"),
    ononline: FunctionAttribute("ononline"),
    onpagehide: FunctionAttribute("onpagehide"),
    onpageshow: FunctionAttribute("onpageshow"),
    onpaste: FunctionAttribute("onpaste"),
    onpause: FunctionAttribute("onpause"),
    onplay: FunctionAttribute("onplay"),
    onplaying: FunctionAttribute("onplaying"),
    onpopstate: FunctionAttribute("onpopstate"),
    onprogress: FunctionAttribute("onprogress"),
    onratechange: FunctionAttribute("onratechange"),
    onreset: FunctionAttribute("onreset"),
    onresize: FunctionAttribute("onresize"),
    onscroll: FunctionAttribute("onscroll"),
    onsearch: FunctionAttribute("onsearch"),
    onseeked: FunctionAttribute("onseeked"),
    onseeking: FunctionAttribute("onseeking"),
    onselect: FunctionAttribute("onselect"),
    onstalled: FunctionAttribute("onstalled"),
    onstorage: FunctionAttribute("onstorage"),
    onsubmit: FunctionAttribute("onsubmit"),
    onsuspend: FunctionAttribute("onsuspend"),
    ontimeupdate: FunctionAttribute("ontimeupdate"),
    ontoggle: FunctionAttribute("ontoggle"),
    onunload: FunctionAttribute("onunload"),
    onvolumechange: FunctionAttribute("onvolumechange"),
    onwaiting: FunctionAttribute("onwaiting"),
    onwheel: FunctionAttribute("onwheel"),
}
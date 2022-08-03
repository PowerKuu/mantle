export type ValueOf<T> = T[keyof T]
export type HTMLElementTypes = ValueOf<HTMLElementTagNameMap>
export type DynamicMantleNodeType = MantleNode<HTMLElementTypes>

export type MantleTagType = keyof HTMLElementTagNameMap
export type MantleChildren = (DynamicMantleNodeType|HTMLElementTypes|Function|string)[]

const SingelFunctionIdentifier = "_element_"
const SingelError = "$signel node has to have a parent"

export class MantleNode<HTMLElementType extends HTMLElementTypes>{
    attr: Object = {}
    element: HTMLElementType
    singeltons: HTMLElementTypes[]

    constructor(public tag: MantleTagType, children:MantleChildren = [], attr: Object = {}) { 
        this.element = document.createElement(tag) as HTMLElementType

        this.AppendChildren(children)
        this.SetAttributes(attr)
    }

    SetAttributes(attr: Object) {
        for (var key in attr) {
            const CunstomAttribute = CustomArgumentMap[key]
            const value = CunstomAttribute ? CunstomAttribute(attr[key], this) : attr[key]
            if (!value) continue
            else this.element.setAttribute(key, value)
        }
        this.attr = attr
    }

    AppendChildren(children: MantleChildren) {
        for (var child of children){
            if (typeof child === 'string') {this.AppendString(child)}

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
        this.clear()
        this.AppendChildren(children)
    }

    AppendMantleNode(node: DynamicMantleNodeType){
        this.element.appendChild(node.element)
    }

    AppendHTMLElement(element: HTMLElement) {
        this.element.appendChild(element)
    }

    AppendString(str: string) {
        this.element.innerHTML += str
    }

    //? Utility functions
    compare(node: MantleNode<HTMLElementType>): boolean {
        if (this.tag != node.tag) return false
        if (JSON.stringify(this.attr) != JSON.stringify(node.attr)) return false
        return true
    }

    clear() {
        this.element.innerHTML = ""
    }

    destroy() {
        this.element.remove()
    }
}

export function $singel<SingeltonType extends (... args: any[]) => DynamicMantleNodeType>(func:SingeltonType, initial:DynamicMantleNodeType) {
    var current = initial

    const update = (...args:Parameters<SingeltonType>):DynamicMantleNodeType => {
        const update = func(...args)

        if (current.compare(update)) {
            current.element.replaceWith(update.element)
            current.destroy()
            current = update
        } else {
            if (!current.element.parentElement) console.error(SingelError)
            current.element.parentElement?.replaceChild(update.element,current.element)
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

const CustomArgumentMap = {
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

    onclick: FunctionAttribute("onclick"),
}
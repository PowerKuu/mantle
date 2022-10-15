import { node, DynamicMantleNodeType} from "./core"

export function _factory_(tag:string, attr:Object, ...args:Array<DynamicMantleNodeType>) {
    return node(tag as keyof HTMLElementTagNameMap, attr, args)
}

export const _fragment_ = "fragment"

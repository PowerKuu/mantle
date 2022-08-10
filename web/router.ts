import normalize from 'normalize-path';
import { NanoEventEmitter } from './utils';
import { DynamicMantleNodeType } from './core';


type MatchResultType = {
    match: boolean
    dynamic?: Object
}

type MantleNodeType = DynamicMantleNodeType|DynamicMantleNodeType[]|HTMLElement|HTMLElement[]|void
type PathCallbackType = (dynamic:Object|undefined) => MantleNodeType|Promise<MantleNodeType>

type PathType = ({
    call: (source:string) => Promise<boolean>,
    priority: number
})

interface InjectOptionsType {
    overwrite?: boolean,
    target?: HTMLElement
}

interface OptionsType {
    source?: string,
    search?: string,
    lowercase?: boolean,
}

interface RouterEventsType {
    "load": (path: string, error: boolean) => void,
    "path": (path: string) => void,
    "404": (path: string) => void,
}

interface FilterTypes {
    "probability": number,
    "user-agent": string[],

    "ip": string[],
    "hostname": string[],
    "city": string[],
    "region": string[],
    "country": string[],
    "loc": string[],
    "org": string[],
    "postal": string[],
    "timezone": string[],
}

interface InfoType {
    "ip": string,
    "hostname": string,
    "city": string,
    "region": string,
    "country": string,
    "loc": string,
    "org": string,
    "postal": string,
    "timezone": string,
}

interface LanguageMapType {
    [key: string]: {
        [lang: string]: any
    }
}

interface StateType {
    path: string,
    search: string,
}

// Deaclear variables
const IpInfoUrl = "https://ipinfo.io/json"

export function NormalizePath(path: string): string {
    return normalize(path)
}
export const DeafultOptions: OptionsType = {
    source: window.location.pathname,
    search: window.location.search,
    lowercase: false,
}

export const DeafultInjectOptions: InjectOptionsType = {
    overwrite: true,
    target: document.getElementById("app") ?? document.body,
}
//

export class Router extends NanoEventEmitter<RouterEventsType> {
    private options: OptionsType = DeafultOptions
    RegisteredPaths: PathType[] = []
    language: string

    path?: string 
    search?: string

    constructor(){
        super()
        this.language = navigator.language || navigator["userLanguage"]
        window.onpopstate = (event) => this.OnPathState.bind(this)(event.state)
    }

    public define(options:OptionsType) {
        this.options.source = options.source ?? DeafultOptions.source
        this.options.search = options.search ?? DeafultOptions.search
        this.options.lowercase = options.lowercase ?? DeafultOptions.lowercase
    }

    public InjectItems(items: MantleNodeType, options: InjectOptionsType = DeafultInjectOptions) {
        const {target, overwrite} = options
        function InjectItem(item: HTMLElement | DynamicMantleNodeType) {
            const HTMLElement = item["element"] ? item["element"] : item

            if (overwrite) {
                target.innerHTML = ""
                target.appendChild(HTMLElement)
            } else {
                target.appendChild(HTMLElement)
            }
        }

        if (!items) return
        if (items instanceof Array) items.forEach(InjectItem)
        else InjectItem(items)
    }

    public async UserInfo(): Promise<InfoType|false>{
        const IpInfoFetch = await fetch(IpInfoUrl)
        if (IpInfoFetch.status != 200) return false
        const IpInfo = await IpInfoFetch.json()

        return IpInfo
    }

    public async UserFilter<FilterType extends keyof FilterTypes>(filter:FilterType, options:FilterTypes[FilterType]):Promise<boolean> {
        const IpInfo = await this.UserInfo()
        if (!IpInfo) return false

        const includes = (match:string) => (options as any).includes(IpInfo[match as string])
        
        switch (filter) {
            case "probability":
                return Math.random() < options
            case "user-agent":
                return (options as any).includes(navigator.userAgent)
            case "ip": 
                return includes("ip")
            case "hostname": 
                return includes("hostname")
            case "city": 
                return includes("city")
            case "region": 
                return includes("region")
            case "country": 
                return includes("country")
            case "loc": 
                return includes("loc")
            case "org": 
                return includes("org")
            case "postal": 
                return includes("postal")
            case "timezone": 
                return includes("timezone")
        }

        return false
    }

    public GetQuery (id: string): string {
        return new Proxy(new URLSearchParams(this.search), {
            get: (searchParams, prop) => searchParams.get(String(prop)),
        })[id]
    }



    public AddPath(match:string, callback:PathCallbackType, inject:InjectOptionsType = DeafultInjectOptions, InjectPriority:number = 0) {
        const target = inject.target ?? DeafultInjectOptions.target
        const overwrite = inject.overwrite ?? DeafultInjectOptions.overwrite
        
        if (!target) throw new Error("No target element specified")

        const call = async (source:string) => {

            const MatchResult = this.MatchPath(match, source)
    
            if (MatchResult.match) {
                const DynamicCallback = MatchResult.dynamic ?? undefined
                const CallbackResult = await callback(DynamicCallback)

                this.InjectItems(CallbackResult, {target, overwrite})
                return true
            }

            return false
        }

        this.RegisteredPaths.push({call, priority: InjectPriority})
        return call
    }

    public async UpdatePathState(path: string = this.options.source, search: string | undefined = "", reload: boolean = true) {  
        path = NormalizePath(path)
        const FullPath = search === "" || !search ? (path === this.path || !this.path ? (path + this.options.search) : path) : path + search

        window.history.pushState({source: path, search}, "", FullPath)
        if (reload) this.OnPathState({path: path, search})
    } 
  
    private async OnPathState({path, search}: StateType) {
        const RegisteredPathsStorted = this.RegisteredPaths.sort((a, b) => a.priority - b.priority)
        const calls:boolean[] = []


        this.emit("path", path)

        for(var RegisteredPath of RegisteredPathsStorted) {
            calls.push(
                await RegisteredPath.call(this.options.lowercase ? path.toLowerCase() : path)
            )
        }   

        this.search = search
        this.path = path

        const error = !calls.includes(true)

        if (error) this.emit("404", path)
        this.emit("load", path, error)
    }


    private MatchPath(match:string, source: string): MatchResultType {
        match = NormalizePath(match)
        source = NormalizePath(source)

        const DynamicMatch = /\[(\w+)\]/g
        const star = /\*/g

        const RegexString = match.replaceAll(DynamicMatch, '([^/]+)').replaceAll(star, '\\A\\Z|[\\s\\S]+')

        const MatchRawArray = [
            ...source.matchAll(
                new RegExp(RegexString, "g")
            )
        ]

        const DynamicArray = [
            ["", ""],
            ...match.matchAll(DynamicMatch)
        ].map(([_, dynamic]) => {return dynamic})

        if (MatchRawArray.length <= 0) return {match: false}
        const valid = MatchRawArray[0][0] === source

        if (!valid) return {match: false}

        if (DynamicArray.length <= 0) return {match: true}

        const MatchArray = MatchRawArray[0]

        if (MatchArray.length != DynamicArray.length) return {match: false}

        const map = {}

        MatchArray.forEach((value, index) => {
            if (index == 0) return
            map[DynamicArray[index]] = decodeURIComponent(value)
        })  
        
        return {match: true, dynamic: map}
    }
}

// Create singelton
export const $router = new Router()
export default $router
//

export class LanguageManger {
    private map: LanguageMapType = {}
    public source = $router.language

    public SetSource(source: string) {
        this.source = source
    }

    public add(language: LanguageMapType) {
        this.map = {...this.map, ...language}
    }

    public get(code: string) {
        return this.map[code][this.source]
    }

}

// Create singelton
export const $language = new LanguageManger()
//
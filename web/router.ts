import normalize from 'normalize-path';
import {NanoEventEmitter} from './utils';
import { DynamicMantleNodeType } from './core';


type MatchResultType = {
    match: boolean
    dynamic?: Object
}

type PathCallbackReturnType = DynamicMantleNodeType|DynamicMantleNodeType[]
type PathCallbackType = (dynamic:Object) => PathCallbackReturnType|Promise<PathCallbackReturnType>

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
    load: (start: boolean) => void,
    update: (path: string) => void,
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

function NormalizePath(path: string): string {
    return normalize(path)
}

const IpInfoUrl = "https://ipinfo.io/json"

const DeafultOptions: OptionsType = {
    source: window.location.pathname,
    search: window.location.search,
    lowercase: false,
}

const DeafultInjectOptions = {
    overwrite: true,
    target: document.getElementById("app")
}

export class Router extends NanoEventEmitter<RouterEventsType> {
    private options: OptionsType = DeafultOptions
    paths: PathType[] = []
    language: string

    LastRawSource?: string
    LastSource?: string

    constructor(){
        super()
        this.language = navigator.language || navigator["userLanguage"]
        window.onpopstate = (event) => this.UpdateState.bind(this)(event.state)
    }

    public define(options:OptionsType) {
        this.options.source = options.source ?? DeafultOptions.source
        this.options.search = options.search ?? DeafultOptions.search
        this.options.lowercase = options.lowercase ?? DeafultOptions.lowercase
    }

    public async info(): Promise<InfoType|false>{
        const IpInfoFetch = await fetch(IpInfoUrl)
        if (IpInfoFetch.status != 200) return false
        const IpInfo = await IpInfoFetch.json()

        return IpInfo
    }

    public async filter<FilterType extends keyof FilterTypes>(filter:FilterType, options:FilterTypes[FilterType]):Promise<boolean> {
        const IpInfo = await this.info()
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

    public add(match:string, callback:PathCallbackType, inject:InjectOptionsType = DeafultInjectOptions, priority:number = 0) {
        const target = inject.target ?? DeafultInjectOptions.target
        const overwrite = inject.overwrite ?? DeafultInjectOptions.overwrite
        
        const call = async (source:string) => {
            const InjectItem = (element) => {
                const HTMLElement = element?.element ? element.element : element

                if (overwrite) {
                    target.innerHTML = ""
                    target.appendChild(HTMLElement)
                } else {
                    target.appendChild(HTMLElement)
                }
            }
    
            const InjectItems = (item) => {
                if (item instanceof Array) item.forEach(InjectItem)
                else InjectItem(item)
            }

    
            const MatchResult = this.match(match, source)
    
            if (MatchResult.match) {
                const DynamicCallback = MatchResult.dynamic ?? undefined
                const CallbackResult = await callback(DynamicCallback)

                InjectItems(CallbackResult)

                return true
            }

            return false
        }

        this.paths.push({call, priority})
        return call
    }

    private async UpdateState(state: any) {
        const source = state?.source ?? this.options.source

        const SortedPaths = this.paths.sort((a, b) => a.priority - b.priority)

        this.emit("load", true)

        for(var path of SortedPaths) {
            await path.call(this.options.lowercase ? source.toLowerCase() : source)
        }   

        this.emit("load", false)
        this.emit("update", source)

        this.LastSource = source
    }

    public async update(source: string = this.options.source, search: string = "", reload: boolean = true) {  
        source = NormalizePath(source)
        const RawSource = search === "" ? (source === this.LastSource || !this.LastSource ? (source + this.options.search) : source) : source + search

        window.history.pushState({source: source}, null, RawSource)
        if (reload) this.UpdateState({source})
    } 



    private match(match:string, source: string): MatchResultType {
        match = NormalizePath(match)
        source = NormalizePath(source)

        const dynamic = /\[(\w+)\]/g
        const star = /\*/g

        const RegexString = match.replaceAll(dynamic, '([^/]+)').replaceAll(star, '\\A\\Z|[\\s\\S]+')

        const MatchRawArray = [
            ...source.matchAll(
                new RegExp(RegexString, "g")
            )
        ]

        const DynamicArray = [
            ["", ""],
            ...match.matchAll(dynamic)
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

export const $router = new Router()
export default $router

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

export const $language = new LanguageManger()
import { $ } from "../core"
import { $router } from "../router"

import style from "./fallback.module.css"

export default function fallback(link:string = "/home", title: string = "Not Found"){
    if (title) document.title = title

    const HomeLink = link ? $("p", ["Home"],  {
        onclick: () => {
            $router.UpdatePathState(link)
        },
        class: style.link
    }) : ""
    
    return $("main", [
        $("h1", ["404"], style.h1),
        $("p", ["The requested page was not found."], style.p),
        HomeLink
    ], style.main)
}   
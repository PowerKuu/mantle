const fs = require("fs")
const fsextra = require("fs-extra")
const path = require("path")
const chalk = require("chalk")

const exec = require("child_process").exec


function create(name, template = "") {
    const root = path.resolve(name)
    
    if (fs.existsSync(root)) {
        console.log(chalk.red(`${root} already exists.`))
        return true
    }

    if (template != "") template = `-${template}`
    exec(`npm create vite@latest ${name} -- --template vanilla${template}`)

    exec(`cd ${name} && npm install`)

    const src = path.join(name, "src")
    const public = path.join(name, "public")

    fsextra.emptyDirSync(src)
    fsextra.emptyDirSync(public)
    fs.writeFileSync(path.join(src, "main.ts"), "")

    console.log(chalk.green(`Created ${name} at ${root} using mantle.cli`))
    
    return false
}

create(process.argv[2], process.argv[3])
import { homedir } from "os"
import { parse } from "path"
import { load } from "@/file-loading";

export interface ServerConfig {
    host: string
    port: number
}

export interface GitConfig {
    remote: string
    cron: string
}

export interface Config {
    kube: string
    docker: string
    jobs: string
    artifacts: string
    slack?: string
    git?: GitConfig
    server: ServerConfig
    namespaces?: string[]
}

export function loadConfig(filePath: string = "./config.yml"): Config {
    const path = parse(filePath)
    const doc = load(filePath) as Partial<Config>
    return validateConfig(path.dir, doc)
}

export function validateConfig(configBasePath: string, partial: Partial<Config>): Config {
    let {
        kube,
        namespaces,
        jobs,
        artifacts,
        slack,
        server = {},
        docker,
        git
    } = partial

    if (docker === undefined) {
        throw new Error(`a docker endpoint is needed`)
    }

    if (kube === undefined) {
        kube = homedir() + "/.kube/config"
    } else {
        kube = `${configBasePath}/${kube}`
    }

    if (jobs === undefined) {
        jobs = `${configBasePath}/jobs`
    } else {
        jobs = `${configBasePath}/${jobs}`
    }

    if (artifacts === undefined) {
        artifacts = `${configBasePath}/artifacts`
    } else {
        artifacts = `${configBasePath}/${artifacts}`
    }

    return { kube, jobs, artifacts, slack, namespaces, git, server: validateServerConfig(server), docker }
}

export function validateServerConfig(partial: Partial<ServerConfig>): ServerConfig {
    const {
        port = Number.parseInt(process.env.SERVER_PORT || "3000"),
        host = process.env.SERVER_HOST || "localhost"
    } = partial

    return { port, host }
}

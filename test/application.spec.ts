import { printHelp } from "../src/commands"
jest.mock("../src/commands")

import { IO } from "../src/IO"

import { Layers } from "../src/dispatcher/model/Layers"
import { Application } from "../src/Application"
import { callParameters } from "./test-utils/jest"
import { CronRegistry } from "../src/crons/CronRegistry"
import { GitConfigRepository, fromConfig } from "../src/config/git/GitConfigRepository"

import { Options } from "../src/options"
import { Config } from "../src/config";

describe("Application", () => {

    let app: Application
    beforeEach(() => {
        jest.resetAllMocks()
        const io = new IO()
        const crons: CronRegistry = new CronRegistry()
        crons.register = jest.fn()
        crons.startAllCrons = jest.fn()
        crons.removeAllCrons = jest.fn()

        const options: Options = { command: "help" }
        app = new Application(io, crons, options)
    })

    it("calls the help function with error", () => {
        app.run()
        expect(printHelp).toHaveBeenCalledTimes(1)
    })

    it("registers the cronjobs", async () => {
        app.options.config = "test/test-config/config.yml"
        process.env.LAYER = Layers.Server

        await app.run()

        expect(app.crons.register).toHaveBeenCalledTimes(3)
        expect(callParameters(app.crons.register, 0)[0]).toEqual("config-reload")
        expect(callParameters(app.crons.register, 1)[0]).toEqual("dev")
        expect(callParameters(app.crons.register, 2)[0]).toEqual("pre")
    })

    it("reloads the cronjobs", async () => {
        app.options.config = "test/test-config/config.yml"
        process.env.LAYER = Layers.Server

        const configRepo: GitConfigRepository = fromConfig(createConfig())!
        configRepo.hasNewConfig = () => (Promise.resolve(true))
        configRepo.fetchNewConfig = () => (Promise.resolve())

        await app.checkForConfigChange(configRepo)

        expect(app.crons.register).toHaveBeenCalledTimes(3)
        expect(callParameters(app.crons.register, 0)[0]).toEqual("config-reload")
        expect(callParameters(app.crons.register, 1)[0]).toEqual("dev")
        expect(callParameters(app.crons.register, 2)[0]).toEqual("pre")
        expect(app.crons.removeAllCrons).toHaveBeenCalledTimes(1)
    })
})

function createConfig(): Config {
    return {
        git: { remote: "someUrl", cron: "someCron" },
        kube: "",
        docker: "",
        jobs: "",
        artifacts: "",
        server: { host: "", port: 2 }
    }
}

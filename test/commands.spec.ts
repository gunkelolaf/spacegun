import { IO } from "../src/IO"

const mockDispatched = jest.fn()
const mockDispatchFn = jest.fn()
jest.mock("../src/dispatcher/index", () => ({
    get: (moduleName: string, procedureName: string) => {
        mockDispatched(moduleName, procedureName)
        return mockDispatchFn
    },
    call: (request: any) => {
        mockDispatched(request.module, request.procedure)
        return mockDispatchFn
    },
    add: () => { },
    path: () => ""
}))

import { commands } from "../src/commands"

describe("commands", () => {
    beforeEach(() => {
        jest.resetAllMocks()
    })

    describe(commands.images.name, () => {

        it("calls the images backend and prints images", async () => {

            // given
            const image = { imageName: "someImage" }
            mockDispatchFn.mockReturnValue([image])

            // when
            await commands.images(createIO())

            // then
            expect(mockDispatched).toHaveBeenCalledTimes(1)
            expect(mockDispatched).toBeCalledWith("images", "images")
        })
    })

    describe(commands.namespaces.name, () => {

        it("calls the namespaces backend and prints namespace", async () => {
            // given
            mockDispatchFn.mockReturnValue(["namespace1", "namespace2"])

            // when
            await commands.namespaces(createIO())

            // then
            expect(mockDispatched).toHaveBeenCalledTimes(3)
            expect(mockDispatched).toBeCalledWith("cluster", "namespaces")
        })
    })

    describe(commands.jobs.name, () => {

        it("calls the jobs backend and prints jobs", async () => {
            // given
            const job = { name: "someJob", from: {}, cluster: "cluster" }
            mockDispatchFn.mockReturnValue([job])

            // when
            await commands.jobs(createIO())

            // then
            expect(mockDispatched).toHaveBeenCalledTimes(1)
            expect(mockDispatched).toBeCalledWith("jobs", "jobs")
        })
    })

    describe(commands.pods.name, () => {

        it("calls the pods backend for each cluster", async () => {
            // given
            mockDispatchFn
                .mockReturnValueOnce(["cluster1", "cluster2"])
                .mockReturnValueOnce([])
                .mockReturnValueOnce([{ name: "service1" }])
                .mockReturnValueOnce(["service1"])
                .mockReturnValueOnce([{ name: "service1" }])

            // when
            await commands.pods(createIO())

            // then
            expect(mockDispatched).toHaveBeenCalledTimes(5)
            expect(mockDispatched).toBeCalledWith("cluster", "clusters")
            expect(mockDispatched).toBeCalledWith("cluster", "namespaces")
            expect(mockDispatched).toBeCalledWith("cluster", "pods")
        })
    })

    describe(commands.scalers.name, () => {

        it("calls the scalers backend for each cluster", async () => {
            // given
            mockDispatchFn
                .mockReturnValueOnce(["cluster1", "cluster2"])
                .mockReturnValueOnce([])
                .mockReturnValueOnce([{ name: "scaler1", replicas: { current: 0, minimum: 1, maximum: 2 } }])
                .mockReturnValueOnce(["service1"])
                .mockReturnValueOnce([{ name: "scaler1", replicas: { current: 1, minimum: 1, maximum: 1 } }])

            // when
            await commands.scalers(createIO())

            // then
            expect(mockDispatched).toHaveBeenCalledTimes(5)
            expect(mockDispatched).toBeCalledWith("cluster", "clusters")
            expect(mockDispatched).toBeCalledWith("cluster", "namespaces")
            expect(mockDispatched).toBeCalledWith("cluster", "scalers")
        })
    })

    describe(commands.deployments.name, () => {

        it("calls the pods deployments for each cluster", async () => {
            // given
            mockDispatchFn
                .mockReturnValueOnce(["cluster1", "cluster2"])
                .mockReturnValueOnce([])
                .mockReturnValueOnce([{ name: "deployment1" }])
                .mockReturnValueOnce(["service1"])
                .mockReturnValueOnce([{ name: "deployment2" }])

            // when
            await commands.deployments(createIO())

            // then
            expect(mockDispatched).toHaveBeenCalledTimes(5)
            expect(mockDispatched).toBeCalledWith("cluster", "clusters")
            expect(mockDispatched).toBeCalledWith("cluster", "namespaces")
            expect(mockDispatched).toBeCalledWith("cluster", "deployments")
        })
    })

    describe(commands.run.name, () => {

        it("runs a job if user agrees", async () => {
            // given
            mockDispatchFn
                .mockReturnValueOnce([{ name: "job1" }, { name: "job2" }])
                .mockReturnValueOnce({
                    name: "plan", deployments: [
                        { name: "deployment1", deployment: {}, image: {} }
                    ]
                })

            const choose = jest.fn().mockImplementation(({ }, b) => b[0])
            const expectFn = jest.fn().mockImplementation(() => true)
            const io = createIO(choose, expectFn)

            // when
            await commands.run(io)

            // then
            expect(mockDispatched).toHaveBeenCalledTimes(3)
            expect(mockDispatched).toBeCalledWith("jobs", "jobs")
            expect(mockDispatched).toBeCalledWith("jobs", "plan")
            expect(mockDispatched).toBeCalledWith("jobs", "run")
        })

        it("does not run a job if user disagrees", async () => {
            // given
            mockDispatchFn
                .mockReturnValueOnce([{ name: "job1" }, { name: "job2" }])
                .mockReturnValueOnce({
                    name: "plan", deployments: [
                        { name: "deployment1", deployment: {}, image: {} }
                    ]
                })

            const choose = jest.fn().mockImplementation(({ }, b) => b[0])
            const expectFn = jest.fn().mockImplementation(() => false)
            const io = createIO(choose, expectFn)

            // when
            await commands.run(io)

            // then
            expect(mockDispatched).toHaveBeenCalledTimes(2)
            expect(mockDispatched).not.toBeCalledWith("jobs", "run")
        })
    })

    describe(commands.deploy.name, () => {

        it("deploys an image if user agrees", async () => {
            // given
            const clusters = ["cluster1", "cluster2"]
            const namespaces: string[] = []
            const deployments = [{ name: "deployment1", image: { name: "image" } }]
            const images = [{ lastUpdated: 1, tag: "tag1" }, { lastUpdated: 2, tag: "tag2" }]
            mockDispatchFn
                .mockReturnValueOnce(clusters)
                .mockReturnValueOnce(namespaces)
                .mockReturnValueOnce(deployments)
                .mockReturnValueOnce(images)
                .mockReturnValueOnce({ name: "deployment1" })

            const choose = jest.fn().mockImplementation(({ }, b) => b[0])
            const expectFn = jest.fn().mockImplementation(() => true)
            const io = createIO(choose, expectFn)

            // when
            await commands.deploy(io)

            // then
            expect(choose).toHaveBeenCalledTimes(3)
            expect(choose).toHaveBeenCalledWith("> ", clusters)
            expect(choose).toHaveBeenCalledWith("> ", deployments)
            expect(choose).toHaveBeenCalledWith("> ", images)

            expect(mockDispatched).toHaveBeenCalledTimes(5)
            expect(mockDispatched).toBeCalledWith("cluster", "clusters")
            expect(mockDispatched).toBeCalledWith("cluster", "namespaces")
            expect(mockDispatched).toBeCalledWith("cluster", "deployments")
            expect(mockDispatched).toBeCalledWith("images", "versions")
            expect(mockDispatched).toBeCalledWith("cluster", "updateDeployment")
        })

        it("asks user for namespace if there are any", async () => {
            // given
            const clusters = ["cluster1", "cluster2"]
            const namespaces = ["service1"]
            const deployments = [{ name: "deployment1", image: { name: "image" } }]
            const images = [{ lastUpdated: 1, tag: "tag1" }, { lastUpdated: 2, tag: "tag2" }]
            mockDispatchFn
                .mockReturnValueOnce(clusters)
                .mockReturnValueOnce(namespaces)
                .mockReturnValueOnce(deployments)
                .mockReturnValueOnce(images)
                .mockReturnValueOnce({ name: "deployment1" })

            const choose = jest.fn().mockImplementation(({ }, b) => b[0])
            const expectFn = jest.fn().mockImplementation(() => true)
            const io = createIO(choose, expectFn)

            // when
            await commands.deploy(io)

            // then
            expect(choose).toHaveBeenCalledTimes(4)
            expect(choose).toHaveBeenCalledWith("> ", clusters)
            expect(choose).toHaveBeenCalledWith("> ", deployments)
            expect(choose).toHaveBeenCalledWith("> ", images)
        })

        it("does not deploy an image if user disagrees", async () => {
            // given
            mockDispatchFn
                .mockReturnValueOnce(["cluster1", "cluster2"])
                .mockReturnValueOnce([])
                .mockReturnValueOnce([{ name: "deployment1", image: { name: "image" } }])
                .mockReturnValueOnce([{ lastUpdated: 1, tag: "tag1" }, { lastUpdated: 2, tag: "tag2" }])
                .mockReturnValueOnce({ name: "deployment1" })

            const choose = jest.fn().mockImplementation(({ }, b) => b[0])
            const expectFn = jest.fn().mockImplementation(() => false)
            const io = createIO(choose, expectFn)

            // when
            await commands.deploy(io)

            // then
            expect(mockDispatched).toHaveBeenCalledTimes(4)
            expect(mockDispatched).not.toBeCalledWith("cluster", "updateDeployment")
        })
    })

    describe(commands.jobSchedules.name, () => {

        it("prints schedules of a job", async () => {
            // given
            const job = { name: "1->2", cluster: "cluster2", from: { type: "cluster", expression: "cluster1" } }
            const schedules = { lastRun: undefined, nextRuns: [] }
            mockDispatchFn
                .mockReturnValueOnce([job])
                .mockReturnValueOnce(schedules)

            const choose = jest.fn().mockImplementation(({ }, b) => b[0])
            const expectFn = jest.fn().mockImplementation(() => true)
            const io = createIO(choose, expectFn)

            // when
            await commands.jobSchedules(io)

            // then
            expect(mockDispatched).toHaveBeenCalledTimes(2)
            expect(mockDispatched).toBeCalledWith("jobs", "jobs")
            expect(mockDispatched).toBeCalledWith("jobs", "schedules")
        })
    })

    describe(commands.help.name, () => {

        it("fetches cluster and image endpoint names", async () => {
            // given
            mockDispatchFn
                .mockReturnValueOnce(["cluster"])
                .mockReturnValueOnce("someEndpoint")

            // when
            await commands.help(createIO())

            // then
            expect(mockDispatched).toHaveBeenCalledTimes(2)
            expect(mockDispatched).toBeCalledWith("cluster", "clusters")
            expect(mockDispatched).toBeCalledWith("images", "endpoint")
        })
    })

    describe(commands.snapshot.name, () => {

        it("creates snapshots", async () => {
            // given
            mockDispatchFn
                .mockReturnValueOnce(["cluster"])
                .mockReturnValueOnce([])
                .mockReturnValueOnce({
                    deployments: [
                        { data: {}, name: "deployment1" },
                        { data: {}, name: "deployment2" }
                    ]
                })

            // when
            await commands.snapshot(createIO())

            // then
            expect(mockDispatched).toHaveBeenCalledTimes(5)
            expect(mockDispatched).toBeCalledWith("cluster", "clusters")
            expect(mockDispatched).toBeCalledWith("cluster", "namespaces")
            expect(mockDispatched).toBeCalledWith("cluster", "takeSnapshot")
            expect(mockDispatched).toBeCalledWith("artifacts", "saveArtifact")
            expect(mockDispatched).toBeCalledWith("artifacts", "saveArtifact")
        })
    })

    describe(commands.apply.name, () => {

        it("applies snapshots", async () => {
            // given
            const deployments = [
                { name: "deployment1", image: { name: "image" } },
                { name: "deployment2", image: { name: "image" } }
            ]
            mockDispatchFn
                .mockReturnValueOnce(["cluster"])
                .mockReturnValueOnce([])
                .mockReturnValueOnce(deployments)
                .mockReturnValueOnce({})
                .mockReturnValueOnce({})

            // when
            await commands.apply(createIO())

            // then
            expect(mockDispatched).toHaveBeenCalledTimes(6)
            expect(mockDispatched).toBeCalledWith("cluster", "clusters")
            expect(mockDispatched).toBeCalledWith("cluster", "namespaces")
            expect(mockDispatched).toBeCalledWith("cluster", "deployments")
            expect(mockDispatched).toBeCalledWith("artifacts", "loadArtifact")
            expect(mockDispatched).toBeCalledWith("artifacts", "loadArtifact")
            expect(mockDispatched).toBeCalledWith("cluster", "applySnapshot")
        })
    })
})

function createIO(choose?: jest.Mock<{}>, expect?: jest.Mock<{}>): IO {
    const io = new IO()
    io.out = jest.fn()
    io.expect = expect || jest.fn()
    io.choose = choose || jest.fn()
    return io
}

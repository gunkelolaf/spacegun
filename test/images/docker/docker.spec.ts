import { DockerImageRepository } from "../../../src/images/docker/DockerImageRepository"
import axios from "axios"

import { axiosSuccess } from "../../test-utils/axios"

describe("DockerImageProvider", () => {

    const config = {}

    let provider: DockerImageRepository
    beforeEach(() => {
        provider = DockerImageRepository.fromConfig("http://repo")
    })

    describe("images", () => {
        const images = ["image1", "image2"]

        beforeEach(() => {
            axios.get = axiosSuccess({ repositories: images })
        })

        it("retrieves images", async () => {
            expect(provider.images()).resolves.toEqual(images)
            expect(axios.get).toHaveBeenCalledWith("http://repo/v2/_catalog", config)
        })

        it("caches images", async () => {
            await provider.images()
            await provider.images()
            expect(axios.get).toHaveBeenCalledTimes(1)
        })
    })

    it("extracts the repository name from the url", () => {
        expect(provider.repository).toEqual("repo")
    })

    describe("versions", () => {

        beforeEach(() => {
            const layer = { v1Compatibility: "{\"created\":\"2018-05-29T11:53:39.318928398Z\"}" }
            axios.get = axiosSuccess(
                { name: "image1", tags: ["tag1", "tag2"] },
                { name: "image1", tag: "tag1", history: [layer] },
                { name: "image1", tag: "tag2", history: [layer] }
            )
        })

        it("retrieves image versions", async () => {
            const versions = await provider.versions("image1")
            expect(versions).toEqual([
                { name: "image1", tag: "tag1", url: "repo/image1:tag1", lastUpdated: Date.parse("2018-05-29T11:53:39.318Z") },
                { name: "image1", tag: "tag2", url: "repo/image1:tag2", lastUpdated: Date.parse("2018-05-29T11:53:39.318Z") }
            ])
            expect(axios.get).toHaveBeenCalledTimes(3)
            expect(axios.get).toHaveBeenCalledWith("http://repo/v2/image1/tags/list", config)
            expect(axios.get).toHaveBeenCalledWith("http://repo/v2/image1/manifests/tag1", config)
            expect(axios.get).toHaveBeenCalledWith("http://repo/v2/image1/manifests/tag2", config)
        })

        it("caches versions", async () => {
            await provider.versions("image1")
            await provider.versions("image1")
            expect(axios.get).toHaveBeenCalledTimes(3)
        })
    })

    it("retrieves last updated of an image version", async () => {
        axios.get = axiosSuccess(
            { name: "image1", tags: ["tag1"] },
            {
                name: "image1", tag: "tag1",
                history: [
                    { v1Compatibility: "{\"created\":\"2018-05-29T11:53:39.318928398Z\"}" },
                    { v1Compatibility: "{\"created\":\"2018-05-05T08:05:40.458179209Z\"}" },
                    { v1Compatibility: "{\"created\":\"2018-05-29T11:53:39.318928398Z\"}" }
                ]
            })
        const versions = await provider.versions("image1")
        expect(versions[0].lastUpdated).toEqual(Date.parse("2018-05-29T11:53:39.318Z"))
        expect(axios.get).toHaveBeenCalledTimes(2)
        expect(axios.get).toHaveBeenCalledWith("http://repo/v2/image1/tags/list", config)
        expect(axios.get).toHaveBeenCalledWith("http://repo/v2/image1/manifests/tag1", config)
    })
})

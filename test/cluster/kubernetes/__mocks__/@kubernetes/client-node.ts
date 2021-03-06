import { Autoscaling_v1Api as api3, Apps_v1beta2Api as api2, Core_v1Api as api1, KubeConfig } from '@kubernetes/client-node'

function mockPod(name: string, image: string, restartCount: number, ready: boolean = true): object {
    const readyCondition = ready ? { type: 'Ready', status: 'True' } : { type: 'Ready', status: 'False' }
    return {
        metadata: { name },
        spec: {
            containers: [{ image }]
        },
        status: {
            conditions: [readyCondition],
            containerStatuses: [{ restartCount }]
        }
    }
}

function mockNamespace(name: string): object {
    return {
        metadata: { name }
    }
}

function mockDeployment(name: string, image: string): object {
    return {
        metadata: { name },
        spec: {
            template: {
                spec: {
                    containers: [{ image }]
                }
            }
        },
    }
}

function mockScaler(name: string, currentReplicas: number, minReplicas: number, maxReplicas: number): object {
    return {
        metadata: { name },
        status: {
            currentReplicas
        },
        spec: {
            minReplicas,
            maxReplicas
        }
    }
}

const Core_v1Api = jest.fn<api1>().mockImplementation(function () {
    const mockedApi = new api1()
    mockedApi.listNamespacedPod = jest.fn().mockReturnValue({
        get: () => ({
            items: [mockPod("pod1", "repo/image1:tag", 0, true), mockPod("pod2", "repo/image2:tag", 1, false)]
        })
    })
    mockedApi.listNamespace = jest.fn().mockReturnValue({
        get: () => ({
            items: [mockNamespace("namespace1"), mockNamespace("namespace2")]
        })
    })
    return mockedApi
});

export const replaceDeploymentMock = jest.fn()

const Apps_v1beta2Api = jest.fn<api2>().mockImplementation(function () {
    const mockedApi = new api2()
    mockedApi.listNamespacedDeployment = jest.fn().mockReturnValue({
        get: () => ({
            items: [mockDeployment("deployment1", "repo/image1:tag"), mockDeployment("deployment2", "repo/image2:tag")]
        })
    })
    mockedApi.patchNamespacedDeployment = jest.fn().mockReturnValue({

        get: () => mockDeployment("updatedDeployment", "repo/updatedImage:tag")
    })
    mockedApi.replaceNamespacedDeployment = jest.fn().mockImplementation((name, namespace, body) => {
        if (name !== "deployment2") {
            replaceDeploymentMock(name, namespace, body)
            return Promise.resolve()
        } else {
            throw Error()
        }
    })
    return mockedApi
})

const Autoscaling_v1Api = jest.fn<api3>().mockImplementation(function () {
    const mockedApi = new api3()
    mockedApi.listNamespacedHorizontalPodAutoscaler = jest.fn().mockReturnValue({
        get: () => ({
            items: [mockScaler("pod1", 0, 1, 2), mockScaler("pod2", 1, 2, 3)]
        })
    })
    return mockedApi
})

export {
    Core_v1Api,
    Apps_v1beta2Api,
    Autoscaling_v1Api,
    KubeConfig
};

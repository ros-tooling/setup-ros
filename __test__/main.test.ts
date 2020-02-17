import * as core from "@actions/core";
import * as actions_exec from "@actions/exec";

import * as linux from "../src/setup-ros-linux";
import * as osx from "../src/setup-ros-osx";
import * as windows from "../src/setup-ros-windows";


describe('basic workflow tests', () => {
    beforeAll(() => {
        jest
            .spyOn(actions_exec, 'exec')
            .mockImplementation(jest.fn());
    })

    afterAll(() => {
        jest.restoreAllMocks();
    })

    it('run Linux workflow', async () => {
        await expect(linux.runLinux()).resolves.not.toThrow();
    })

    it('run Windows workflow', async () => {
        await expect(windows.runWindows()).resolves.not.toThrow();
    })

    it('run macOS workflow', async () => {
        await expect(osx.runOsX()).resolves.not.toThrow();
    })
})

describe('required-ros-distributions/melodic workflow tests', () => {
    beforeAll(() => {
        jest
            .spyOn(actions_exec, 'exec')
            .mockImplementation(jest.fn());
        jest
            .spyOn(core, 'getInput')
            .mockReturnValue('melodic');
    })

    afterAll(() => {
        jest.restoreAllMocks();
    })

    it('run Linux workflow', async () => {
        await expect(linux.runLinux()).resolves.not.toThrow();
    })

    it('run Windows workflow', async () => {
        await expect(windows.runWindows()).resolves.not.toThrow();
    })

    it('run macOS workflow', async () => {
        await expect(osx.runOsX()).resolves.not.toThrow();
    })
})

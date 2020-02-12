import * as core from "@actions/core";
import * as im from "@actions/exec/lib/interfaces";

import * as linux from "../src/setup-ros-linux";
import * as osx from "../src/setup-ros-osx";
import * as windows from "../src/setup-ros-windows";
import * as utils from "../src/utils";


describe('basic workflow tests', () => {
    let linesOfExec: string[] = [];
    beforeAll(() => {
        jest
            .spyOn(utils, 'exec')
            .mockImplementation(async (
                commandLine: string,
                args?: string[],
                options?: im.ExecOptions,
                log_message?: string) => {
                    let flatArgs = ''
                    if (args) {
                        flatArgs = args.map(i => i).join(' ')
                    }
                    linesOfExec.push(`${commandLine} ${flatArgs}`)
                    return 0;
                });
    })

    beforeEach(() => {
        linesOfExec = [];
    })

    afterAll(() => {
        jest.restoreAllMocks();
    })

    it('run Linux workflow', async () => {
        await linux.runLinux();
        console.log(linesOfExec);
    })

    it('run Windows workflow', async () => {
        await windows.runWindows();
        console.log(linesOfExec);
    })

    it('run macOS workflow', async () => {
        await osx.runOsX();
        console.log(linesOfExec);
    })
})

describe('required-ros-distributions workflow tests', () => {
    let linesOfExec: string[] = [];

    beforeAll(() => {
        jest
            .spyOn(utils, 'exec')
            .mockImplementation(async (
                commandLine: string,
                args?: string[],
                options?: im.ExecOptions,
                log_message?: string) => {
                    let flatArgs = ''
                    if (args) {
                        flatArgs = args.map(i => i).join(' ')
                    }
                    linesOfExec.push(`${commandLine} ${flatArgs}`)
                    return 0;
                });
        jest
            .spyOn(core, 'getInput')
            .mockReturnValue('melodic')
    })

    beforeEach(() => {
        linesOfExec = [];
    })

    afterAll(() => {
        jest.restoreAllMocks();
    })

    it('run Linux workflow', async () => {
        await linux.runLinux();
        console.log(linesOfExec);
        expect(linesOfExec)
            .toContain('sudo DEBIAN_FRONTEND=noninteractive RTI_NC_LICENSE_ACCEPTED=yes apt-get install --no-install-recommends --quiet --yes ros-melodic-desktop')
    })

    it('run Windows workflow', async () => {
        await windows.runWindows();
        console.log(linesOfExec);
        expect(linesOfExec)
            .toContain('choco install --limit-output --yes python --version=3.7.6')
    })

    it('run macOS workflow', async () => {
        await osx.runOsX();
        console.log(linesOfExec);
    })
})
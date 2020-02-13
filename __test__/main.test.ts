import * as core from "@actions/core";
import * as im from "@actions/exec/lib/interfaces";

import * as linux from "../src/setup-ros-linux";
import * as osx from "../src/setup-ros-osx";
import * as windows from "../src/setup-ros-windows";
import * as utils from "../src/utils";

utils.lib.exec = jest.fn(async (commandLine: string,
    args?: string[],
    options?: im.ExecOptions,
    log_message?: string) => 
    {
        const argsAsString = (args || []).join(" ");
        const message = log_message || `Invoking "${commandLine} ${argsAsString}"`;
        return core.group(message, async () => {
            return 0;
        });
    });

test('run Windows workflow', async () => {
    return windows.runWindows();
})

test('run Linux workflow', async () => {
    return linux.runLinux();
})

test('run macOS workflow', async () => {
    return osx.runOsX();
})

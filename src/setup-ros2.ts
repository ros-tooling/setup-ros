import * as core from "@actions/core";

import * as linux from "./setup-ros2-linux";
import * as osx from "./setup-ros2-osx";
import * as windows from "./setup-ros2-windows";

async function run() {
	try {
		const platform = process.platform;
		if (platform === "darwin") {
			await osx.runOsX();
		} else if (platform === "win32") {
			await windows.runWindows();
		} else if (platform === "linux") {
			await linux.runLinux();
		} else {
			core.setFailed(`Unsupported platform ${platform}`);
		}
	} catch (error) {
		core.setFailed(error.message);
	}
}

run();

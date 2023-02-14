import * as core from "@actions/core";

import * as linux from "./setup-ros-linux";
import * as osx from "./setup-ros-osx";
import * as windows from "./setup-ros-windows";

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
		let errorMessage = "Unknown error";
		if (error instanceof Error) {
			errorMessage = error.message;
		}
		core.setFailed(errorMessage);
	}
}

run();

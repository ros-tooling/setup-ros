import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import * as path from "path";

import * as chocolatey from "./package_manager/chocolatey";
import * as pip from "./package_manager/pip";
import * as utils from "./utils";

const binaryReleases: { [index: string]: string } = {
	dashing:
		"https://github.com/ros2/ros2/releases/download/release-dashing-20200722/ros2-dashing-20200722-windows-amd64.zip",
	eloquent:
		"https://github.com/ros2/ros2/releases/download/release-eloquent-20200124/ros2-eloquent-20200124-windows-release-amd64.zip",
	foxy:
		"https://github.com/ros2/ros2/releases/download/release-foxy-20200710/ros2-foxy-20200710-windows-release-amd64.zip",
};

const pip3Packages: string[] = ["lxml", "netifaces"];

/**
 * Install ROS 2 build tools.
 */
async function prepareRos2BuildEnvironment() {
	let python_dir = tc.find("Python", "3.7");

	await utils.exec(
		path.join(python_dir, "python"),
		[
			"-c",
			"import sysconfig; print(sysconfig.get_config_var('BINDIR')); print(sysconfig.get_path('scripts'))",
		],
		{
			listeners: {
				stdline: (data: string) => {
					const p = data.trim();
					if (p) {
						core.info("Prepending to path: " + JSON.stringify(p));
						core.addPath(p);
					}
				},
			},
		}
	);

	core.addPath("c:\\program files\\cppcheck");
	await chocolatey.installChocoDependencies();
	await chocolatey.downloadAndInstallRos2NugetPackages();
	await pip.installPython3Dependencies(false);
	await pip.runPython3PipInstall(pip3Packages, false);
	await pip.runPython3PipInstall(["rosdep", "vcstool"], false);
	return utils.exec(`rosdep`, ["init"]);
}

/**
 * Install ROS 2 binary releases.
 */
async function prepareRos2BinaryReleases() {
	for (let rosDistro of utils.getRequiredRosDistributions()) {
		if (rosDistro in binaryReleases) {
			await utils.exec("wget", [
				"--quiet",
				binaryReleases[rosDistro],
				"-O",
				`${rosDistro}.zip`,
			]);
			await utils.exec("7z", [
				"x",
				`${rosDistro}.zip`,
				"-y",
				`-oC:\\dev\\${rosDistro}`
			]);
		}
	}
}

/**
 * Install build environment on a Windows worker.
 */
export async function runWindows() {
	await prepareRos2BuildEnvironment();
	return await prepareRos2BinaryReleases();
}

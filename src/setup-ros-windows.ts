import * as core from "@actions/core";

import * as chocolatey from "./package_manager/chocolatey";
import * as pip from "./package_manager/pip";
import * as utils from "./utils";

const python37: string =
	"c:\\hostedtoolcache\\windows\\Python\\3.7.6\\x64";

const binaryReleases: { [index: string]: string; } =
	{
		"dashing": "https://github.com/ros2/ros2/releases/download/release-dashing-20191213/ros2-dashing-20191213-windows-amd64.zip",
		"eloquent": "https://github.com/ros2/ros2/releases/download/release-eloquent-20200124/ros2-eloquent-20200124-windows-release-amd64.zip"
	};

const pip3Packages: string[] = [
	"lxml",
	"netifaces",
	"numpy",
];

/**
 * Install ROS 2 build tools.
 */
async function prepareRos2BuildEnvironment() {
	await utils.exec(`cmd /c mklink /d c:\\python37 ${python37}`);
	core.exportVariable("PYTHONHOME", "c:\\python37");
	core.addPath("c:\\python37");
	core.addPath("c:\\python37\\scripts");
	await chocolatey.installChocoDependencies();
	await chocolatey.downloadAndInstallRos2NugetPackages();
	await pip.installPython3Dependencies(false);
	await pip.runPython3PipInstall(pip3Packages, false);
	await pip.runPython3PipInstall(["rosdep", "vcstool"], false);
	return utils.exec(`python c:\\python37\\scripts\\rosdep`, ["init"]);
}

/**
 * Install ROS 2 binary releases.
 */
async function prepareRos2BinaryReleases() {
	for (let rosDistro of utils.getRequiredRosDistributions()) {
		if (rosDistro in binaryReleases)
		{
			await utils.exec("wget", ["--quiet", binaryReleases[rosDistro], "-O", `${rosDistro}.zip`]);
			await utils.exec("7z", ["x", `${rosDistro}.zip`, "-y", `-oc:\\dev\\${rosDistro}`])
		}
	}
}

/**
 * Install build environment on a Windows worker.
 */
export async function runWindows() {
	await prepareRos2BuildEnvironment();
	return prepareRos2BinaryReleases();
}

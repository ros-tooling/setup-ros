import * as core from "@actions/core";

import * as chocolatey from "./package_manager/chocolatey";
import * as pip from "./package_manager/pip";
import * as utils from "./utils";

const rosdepBin: string =
	"c:\\hostedtoolcache\\windows\\python\\3.6.8\\x64\\scripts\\rosdep";

/**
 * Install ROS 2 on a Windows worker.
 */
export async function runWindows() {
	await chocolatey.installChocoDependencies();
	await chocolatey.downloadAndInstallRos2NugetPackages();
	await pip.installPython3Dependencies(false);
	await pip.runPython3PipInstall(["rosdep", "vcstool"], false);
	core.addPath("c:\\hostedtoolcache\\windows\\python\\3.6.8\\x64\\scripts");
	return utils.lib.exec(`py ${rosdepBin}`, ["init"]);
}

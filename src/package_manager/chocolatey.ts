import * as utils from "../utils";

const chocoCommandLine: string[] = ["install", "--limit-output", "--yes"];

const chocoDependencies: string[] = ["patch", "cppcheck", "python", "wget"];

const ros2ChocolateyPackagesUrl: string[] = [
	"https://github.com/ros2/choco-packages/releases/download/2019-10-24/asio.1.12.1.nupkg",
	"https://github.com/ros2/choco-packages/releases/download/2019-10-24/cunit.2.1.3.nupkg",
	"https://github.com/ros2/choco-packages/releases/download/2019-10-24/eigen.3.3.4.nupkg",
	"https://github.com/ros2/choco-packages/releases/download/2019-10-24/log4cxx.0.10.0-2.nupkg",
	"https://github.com/ros2/choco-packages/releases/download/2019-10-24/tinyxml-usestl.2.6.2.nupkg",
	"https://github.com/ros2/choco-packages/releases/download/2019-10-24/tinyxml2.6.0.0.nupkg"
];
const ros2ChocolateyPackages: string[] = [
	"asio",
	"cunit",
	"eigen",
	"log4cxx",
	"tinyxml-usestl",
	"tinyxml2"
];

/**
 * Run choco install on the list of specified packages.
 *
 * @param   packages        list of Chocolatey pacakges to be installed
 * @returns Promise<number> exit code
 */
export async function runChocoInstall(packages: string[]): Promise<number> {
	return utils.exec("choco", chocoCommandLine.concat(packages));
}

/**
 * Install ROS 2 Chocolatey dependencies.
 *
 * @returns Promise<number> exit code
 */
export async function installChocoDependencies(): Promise<number> {
	return runChocoInstall(chocoDependencies);
}

/**
 * Download Open Robotics maintained packages from GitHub and install them.
 *
 * @returns Promise<number> exit code
 */
export async function downloadAndInstallRos2NugetPackages(): Promise<number> {
	await utils.exec("wget", ["--quiet"].concat(ros2ChocolateyPackagesUrl));
	return utils.exec(
		"choco",
		["install", "-s", ".", "-y"].concat(ros2ChocolateyPackages)
	);
}

import * as utils from "../utils";

const chocoCommandLine: string[] = [
	"install",
	"--limit-output",
	"--no-progress",
	"--yes",
];

const chocoDependencies: string[] = ["cppcheck", "wget", "7zip"];

const ros2ChocolateyPackagesUrl: string[] = [
	"https://github.com/ros2/choco-packages/releases/download/2019-10-24/asio.1.12.1.nupkg",
	"https://github.com/ros2/choco-packages/releases/download/2019-10-24/cunit.2.1.3.nupkg",
	"https://github.com/ros2/choco-packages/releases/download/2019-10-24/eigen.3.3.4.nupkg",
	"https://github.com/ros2/choco-packages/releases/download/2019-10-24/log4cxx.0.10.0-2.nupkg",
	"https://github.com/ros2/choco-packages/releases/download/2019-10-24/tinyxml-usestl.2.6.2.nupkg",
	"https://github.com/ros2/choco-packages/releases/download/2019-10-24/tinyxml2.6.0.0.nupkg",
];
const ros2ChocolateyPackages: string[] = [
	"asio",
	"cunit",
	"eigen",
	"log4cxx",
	"tinyxml-usestl",
	"tinyxml2",
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
	// The ROS 2 NUGET Chocolatey packages expect a registry entry of
	// HKCU\SOFTWARE\Kitware\CMake to exist; if it doesn't, they don't
	// properly register themselves with CMake and thus downstream software
	// can't properly find them.  The Windows image that is currently available
	// to GitHub actions (https://github.com/actions/virtual-environments/blob/win19/20200608.1/images/win/Windows2019-Readme.md)
	// doesn't seem to have this key, so add it by hand here.
	await utils.exec("reg", ["add", "HKCU\\SOFTWARE\\Kitware\\CMake", "/f"]);
	return utils.exec(
		"choco",
		chocoCommandLine.concat("--source", ".").concat(ros2ChocolateyPackages)
	);
}

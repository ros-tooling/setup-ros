import * as exec from "@actions/exec";
import * as im from "@actions/exec/lib/interfaces";
import * as utils from "../utils";

const CONNEXT_APT_PACKAGE_NAME = "rti-connext-dds-5.3.1";  // RTI Connext

const aptCommandLine: string[] = [
	"DEBIAN_FRONTEND=noninteractive",
	"RTI_NC_LICENSE_ACCEPTED=yes",
	"apt-get",
	"install",
	"--no-install-recommends",
	"--quiet",
	"--yes",
];

const aptDependencies: string[] = [
	"libssl-dev", // required for pip3 cryptography module
	"python3-dev", // required for pip3 cryptography module
	"build-essential",
	"clang",
	"cmake",
	"git",
	"lcov",
	"libc++-dev",
	"libc++abi-dev",
	"python", // required for sourcing setup.sh
	"python3-catkin-pkg-modules",
	"python3-pip",
	"python3-vcstool",
	"wget",
	// FastRTPS dependencies
	"libasio-dev",
	"libtinyxml2-dev",
];

const distributionSpecificAptDependencies = {
	bionic: [
		// OpenSplice
		"libopensplice69",

		// python3-rosdep is conflicting with ros-melodic-desktop-full,
		// and should not be used here. See ros-tooling/setup-ros#74
		"python-rosdep",
	],
	focal: [
		// python-rosdep does not exist on Focal, so python3-rosdep is used.
		// The issue with ros-melodic-desktop-full is also non-applicable.
		"python3-rosdep",
	],
	xenial: [
		// OpenSplice
		"libopensplice69",

		// python3-rosdep is conflicting with ros-melodic-desktop-full,
		// and should not be used here. See ros-tooling/setup-ros#74
		"python-rosdep",
	],
};

/**
 * Run apt-get install on list of specified packages.
 *
 * This invokation guarantees that APT install will be non-blocking.
 *
 * In particular, it automatically accepts the RTI Connext license, which would block forever otherwise.
 * Skipping the license agreement page requires RTI_NC_LICENSE_ACCEPTED to be set to "yes".
 * This package would normally be installed automatically by rosdep, but
 * there is no way to pass RTI_NC_LICENSE_ACCEPTED through rosdep.
 *
 * @param   packages        list of Debian pacakges to be installed
 * @returns Promise<number> exit code
 */
export async function runAptGetInstall(packages: string[]): Promise<number> {
	return utils.exec("sudo", aptCommandLine.concat(packages));
}

/**
 * Determines the Ubuntu distribution codename.
 *
 * This function directly source /etc/lsb-release instead of invoking
 * lsb-release as the package may not be installed.
 *
 * @returns Promise<string> Ubuntu distribution codename (e.g. "focal")
 */
async function determineDistribCodename(): Promise<string> {
	let distribCodename = "";
	const options: im.ExecOptions = {};
	options.listeners = {
		stdout: (data: Buffer) => {
			distribCodename += data.toString();
		},
	};
	await utils.exec(
		"bash",
		["-c", 'source /etc/lsb-release ; echo -n "$DISTRIB_CODENAME"'],
		options
	);
	return distribCodename;
}

/**
 * Run ROS 2 APT dependencies.
 *
 * @returns Promise<number> exit code
 */
export async function installAptDependencies(installConnext = false): Promise<number> {
	let aptPackages: string[] = installConnext ?
                aptDependencies.concat(CONNEXT_APT_PACKAGE_NAME) : aptDependencies;
	const distribCodename = await determineDistribCodename();
	const additionalAptPackages =
		distributionSpecificAptDependencies[distribCodename] || [];
	aptPackages = aptPackages.concat(additionalAptPackages);
	return runAptGetInstall(aptPackages);
}

import * as utils from "../utils";

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
	"clang",
	"lcov",
	"python3-rosinstall-generator",
];

const distributionSpecificAptDependencies = {
	focal: [
		// Basic development packages
		"build-essential",
		"cmake",
		"git",
		"python3-pip",
		"python3-catkin-pkg-modules",
		"python3-vcstool",
		"wget",
		// python-rosdep does not exist on Focal, so python3-rosdep is used.
		"python3-rosdep",
		// python required for sourcing setup.sh
		"python",
		"libc++-dev",
		"libc++abi-dev",
	],
	jammy: [
		// Basic development packages (from ROS 2 source/development setup instructions)
		// ros-dev-tools includes many packages that we needed to include manually in Focal & older
		"python3-flake8-docstrings",
		"python3-pip",
		"python3-pytest-cov",
		"python3-flake8-blind-except",
		"python3-flake8-builtins",
		"python3-flake8-class-newline",
		"python3-flake8-comprehensions",
		"python3-flake8-deprecated",
		"python3-flake8-import-order",
		"python3-flake8-quotes",
		"python3-pytest-repeat",
		"python3-pytest-rerunfailures",
		"ros-dev-tools",
		// Additional colcon packages (not included in ros-dev-tools)
		"python3-colcon-coveragepy-result",
		"python3-colcon-lcov-result",
		"python3-colcon-meson",
		"python3-colcon-mixin",
		// FastRTPS dependencies
		"libasio-dev",
		"libtinyxml2-dev",
		// libc++-dev and libc++abi-dev installs intentionally removed because:
		// https://github.com/ros-tooling/setup-ros/issues/506
	],
	noble: [
		// Basic development packages (from ROS 2 source/development setup instructions)
		// ros-dev-tools includes many packages that we needed to include manually in Focal & older
		"python3-flake8-docstrings",
		"python3-pip",
		"python3-pytest-cov",
		"python3-flake8-blind-except",
		"python3-flake8-builtins",
		"python3-flake8-class-newline",
		"python3-flake8-comprehensions",
		"python3-flake8-deprecated",
		"python3-flake8-import-order",
		"python3-flake8-quotes",
		"python3-pytest-repeat",
		"python3-pytest-rerunfailures",
		"ros-dev-tools",
		// Additional colcon packages (not included in ros-dev-tools)
		"python3-colcon-coveragepy-result",
		"python3-colcon-lcov-result",
		"python3-colcon-meson",
		"python3-colcon-mixin",
		// FastRTPS dependencies
		"libasio-dev",
		"libtinyxml2-dev",
	],
};

const aptRtiConnextDds = {
	jammy: "rti-connext-dds-6.0.1",
	noble: "rti-connext-dds-6.0.1",
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
 * Run ROS 2 APT dependencies.
 *
 * @returns Promise<number> exit code
 */
export async function installAptDependencies(
	installConnext: boolean = false,
): Promise<number> {
	const distribCodename = await utils.determineDistribCodename();
	let aptPackages: string[] = installConnext
		? aptDependencies.concat(aptRtiConnextDds[distribCodename] || [])
		: aptDependencies;
	const additionalAptPackages =
		distributionSpecificAptDependencies[distribCodename] || [];
	aptPackages = aptPackages.concat(additionalAptPackages);
	return runAptGetInstall(aptPackages);
}

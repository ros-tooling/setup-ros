import * as core from "@actions/core";
import * as io from "@actions/io";

import * as apt from "./package_manager/apt";
import * as pip from "./package_manager/pip";
import * as utils from "./utils";

const rosAptSourceRepository =
	"https://api.github.com/repos/ros-infrastructure/ros-apt-source/releases/latest";
const rosAptSourceDownloadBase =
	"https://github.com/ros-infrastructure/ros-apt-source/releases/download";

/**
 * Configure basic OS stuff.
 */
async function configOs(): Promise<void> {
	// When this action runs in a Docker image, sudo may be missing.
	// This installs sudo to avoid having to handle both cases (action runs as
	// root, action does not run as root) everywhere in the action.
	try {
		await io.which("sudo", true);
	} catch (err) {
		await utils.exec("apt-get", ["update"]);
		await utils.exec("apt-get", [
			"install",
			"--no-install-recommends",
			"--quiet",
			"--yes",
			"sudo",
		]);
	}

	await utils.exec("sudo", ["bash", "-c", "echo 'Etc/UTC' > /etc/timezone"]);
	await utils.exec("sudo", ["apt-get", "update"]);

	// Install tools required to configure the worker system.
	await apt.runAptGetInstall([
		"curl",
		"ca-certificates",
		"locales",
		"lsb-release",
	]);

	// Select a locale supporting Unicode.
	await utils.exec("sudo", ["locale-gen", "en_US", "en_US.UTF-8"]);
	core.exportVariable("LANG", "en_US.UTF-8");

	// Enforce UTC time for consistency.
	await utils.exec("sudo", ["bash", "-c", "echo 'Etc/UTC' > /etc/timezone"]);
	await utils.exec("sudo", [
		"ln",
		"-sf",
		"/usr/share/zoneinfo/Etc/UTC",
		"/etc/localtime",
	]);
	await apt.runAptGetInstall(["tzdata"]);
}

/**
 * Install the ROS APT source package for the current Ubuntu release.
 *
 * This is necessary even when building from source to install colcon, vcs, etc.
 */
async function installRosAptSourcePackage(
	aptSourcePackageName: string,
): Promise<void> {
	await utils.exec("bash", [
		"-c",
		`set -eo pipefail && export ROS_APT_SOURCE_VERSION=$(curl -s ${rosAptSourceRepository} | grep -F "tag_name" | awk -F'"' '{print $4}') && ubuntu_codename=$(. /etc/os-release && echo \${UBUNTU_CODENAME:-\${VERSION_CODENAME}}) && package_name="${aptSourcePackageName}" && curl --fail --location --retry 3 --retry-delay 2 -o "/tmp/\${package_name}.deb" "${rosAptSourceDownloadBase}/\${ROS_APT_SOURCE_VERSION}/\${package_name}_\${ROS_APT_SOURCE_VERSION}.\${ubuntu_codename}_all.deb" && sudo dpkg -i "/tmp/\${package_name}.deb" && rm -f "/tmp/\${package_name}.deb"`,
	]);
	await utils.exec("sudo", ["apt-get", "update"]);
}

/**
 * Check if the ROS APT repository is already configured.
 */
async function isRosAptSourcePackageInstalled(
	use_ros2_testing: boolean,
): Promise<boolean> {
	const expectedAptRepoUrl = `http://packages.ros.org/ros2${use_ros2_testing ? "-testing" : ""}/ubuntu`;
	// We need to have run 'apt update' at least once before this, but we do that earlier
	const aptCachePolicyOutput = await utils.getCommandOutput(`apt-cache policy`);
	return aptCachePolicyOutput.includes(expectedAptRepoUrl);
}

/**
 * Install the ROS APT source package for the current Ubuntu release if it is not already installed.
 */
async function installRosAptSourcePackageIfNeeded(
	ubuntuCodename: string,
	use_ros2_testing: boolean,
): Promise<void> {
	const isAlreadyInstalled =
		await isRosAptSourcePackageInstalled(use_ros2_testing);
	if (!isAlreadyInstalled) {
		const aptSourcePackageName = determineAptSourcePackageName(
			ubuntuCodename,
			use_ros2_testing,
		);
		await installRosAptSourcePackage(aptSourcePackageName);
	}
}

// Ubuntu distribution for ROS 1
const ros1UbuntuVersion = "focal";

/**
 * Determine the ROS APT source package to install.
 *
 * @param ubuntuCodename the Ubuntu version codename
 */
function determineAptSourcePackageName(
	ubuntuCodename: string,
	use_ros2_testing: boolean,
): string {
	// There is now no Ubuntu version overlap between ROS 1 and ROS 2.
	if (ros1UbuntuVersion === ubuntuCodename) {
		return "ros-apt-source";
	}

	return `ros2${use_ros2_testing ? "-testing" : ""}-apt-source`;
}

/**
 * Initialize rosdep.
 */
async function rosdepInit(): Promise<void> {
	/**
	 * Try to remove the default file first in case this environment has already done a rosdep
	 * init before.
	 */
	await utils.exec("sudo", [
		"bash",
		"-c",
		"rm /etc/ros/rosdep/sources.list.d/20-default.list || true",
	]);
	await utils.exec("sudo", ["rosdep", "init"]);
}

/**
 * Install ROS 1 or 2 (development packages and/or ROS binaries) on a Linux worker.
 */
export async function runLinux(): Promise<void> {
	// Get user input & validate
	const use_ros2_testing = core.getInput("use-ros2-testing") === "true";
	const installConnext = core.getInput("install-connext") === "true";

	await configOs();

	const ubuntuCodename = await utils.determineDistribCodename();
	await installRosAptSourcePackageIfNeeded(ubuntuCodename, use_ros2_testing);

	if ("noble" !== ubuntuCodename && "resolute" !== ubuntuCodename) {
		// Temporary fix to avoid error mount: /var/lib/grub/esp: special device (...) does not exist.
		const arch = await utils.getArch();
		await utils.exec("sudo", ["apt-mark", "hold", `grub-efi-${arch}-signed`]);
		await utils.exec("sudo", ["apt-get", "upgrade", "-y"]);
	}

	// Install development-related packages and some common dependencies
	await apt.installAptDependencies(installConnext);

	// We don't use pip here to install dependencies for ROS 2
	if (ubuntuCodename === ros1UbuntuVersion) {
		/* pip3 dependencies need to be installed after the APT ones, as pip3
		modules such as cryptography requires python-dev to be installed,
		because they rely on Python C headers. */
		await pip.installPython3Dependencies();
	}

	await rosdepInit();

	for (const rosDistro of utils.getRequiredRosDistributions()) {
		await apt.runAptGetInstall([`ros-${rosDistro}-desktop`]);
	}
}

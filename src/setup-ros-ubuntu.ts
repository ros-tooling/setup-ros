import * as core from "@actions/core";
import * as io from "@actions/io";

import * as apt from "./package_manager/apt";
import * as pip from "./package_manager/pip";
import * as utils from "./utils";

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
	await apt.runAptGetInstall(["curl", "gnupg2", "locales", "lsb-release"]);

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

// Ubuntu distribution for ROS 1
const ros1UbuntuVersion = "focal";

/**
 * Add OSRF APT repository.
 *
 * @param ubuntuCodename the Ubuntu version codename
 */
async function addAptRepo(
	ubuntuCodename: string,
	use_ros2_testing: boolean,
): Promise<void> {
	// There is now no Ubuntu version overlap between ROS 1 and ROS 2
	const keyring = "/usr/share/keyrings/ros-archive-keyring.gpg";
	const arch = await utils.getArch();
	if (ros1UbuntuVersion === ubuntuCodename) {
		await utils.exec("sudo", [
			"bash",
			"-c",
			`curl -L https://github.com/ros-infrastructure/ros-apt-source/raw/refs/heads/main/ros-apt-source/keys/ros-archive-keyring.gpg -o ${keyring}`,
		]);
		await utils.exec("sudo", [
			"bash",
			"-c",
			`echo "deb [arch=${arch} signed-by=${keyring}] http://packages.ros.org/ros/ubuntu ${ubuntuCodename} main" > /etc/apt/sources.list.d/ros-latest.list`,
		]);
	} else {
		await utils.exec("sudo", [
			"bash",
			"-c",
			`curl -L https://github.com/ros-infrastructure/ros-apt-source/raw/refs/heads/main/ros-apt-source/keys/ros2-archive-keyring.gpg -o ${keyring}`,
		]);
		await utils.exec("sudo", [
			"bash",
			"-c",
			`echo "deb [arch=${arch} signed-by=${keyring}] http://packages.ros.org/ros2${
				use_ros2_testing ? "-testing" : ""
			}/ubuntu ${ubuntuCodename} main" > /etc/apt/sources.list.d/ros2-latest.list`,
		]);
	}

	await utils.exec("sudo", ["apt-get", "update"]);
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
	await addAptRepo(ubuntuCodename, use_ros2_testing);

	if ("noble" !== ubuntuCodename) {
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

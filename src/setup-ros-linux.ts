import * as core from "@actions/core";
import * as io from "@actions/io";

import * as apt from "./package_manager/apt";
import * as pip from "./package_manager/pip";
import * as utils from "./utils";

/**
 * Install ROS 2 on a Linux worker.
 */
export async function runLinux() {
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
			"sudo"
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
		"/etc/localtime"
	]);
	await apt.runAptGetInstall(["tzdata"]);

	// OSRF APT repository is necessary, even when building
	// from source to install colcon, vcs, etc.
	await utils.exec("sudo", [
		"apt-key",
		"adv",
		"--keyserver",
		"hkp://keyserver.ubuntu.com:80",
		"--recv-keys",
		"C1CF6E31E6BADE8868B172B4F42ED6FBAB17C654"
	]);
	await utils.exec("sudo", [
		"bash",
		"-c",
		`echo "deb http://packages.ros.org/ros/ubuntu $(lsb_release -sc) main" > /etc/apt/sources.list.d/ros-latest.list`
	]);
	await utils.exec("sudo", [
		"bash",
		"-c",
		`echo "deb http://packages.ros.org/ros2/ubuntu $(lsb_release -sc) main" > /etc/apt/sources.list.d/ros2-latest.list`
	]);
	await utils.exec("sudo", ["apt-get", "update"]);

	// Install colcon, rosdep, and vcs, as well as FastRTPS dependencies, OpenSplice, and RTI Connext.
	// colcon and vcs dependencies (e.g. git), as well as
	// base building packages are not pulled by rosdep, so
	// they are also installed during this stage.
	await apt.installAptDependencies();

	// pip3 dependencies need to be installed after the APT ones, as pip3
	// modules such as cryptography requires python-dev to be installed,
	// because they rely on Python C headers.
	await pip.installPython3Dependencies();

	// Initializes rosdep
	await utils.exec("sudo", ["rosdep", "init"]);

	const requiredRosDistributions = core.getInput("required-ros-distributions");
	if (requiredRosDistributions) {
		const requiredRosDistributionsList = requiredRosDistributions.split(
			RegExp("\\s")
		);
		for (let rosDistro of requiredRosDistributionsList) {
			await apt.runAptGetInstall([`ros-${rosDistro}-desktop`]);
		}
	}
}

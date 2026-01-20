import * as core from "@actions/core";
import * as io from "@actions/io";

import * as apt from "./package_manager/apt";
import * as pip from "./package_manager/pip";
import * as utils from "./utils";

import * as path from "path";
import fs from "fs";

// Open Robotics APT Repository public GPG key, as retrieved at:
// https://github.com/ros/rosdistro/blob/master/ros.asc
//
// Unfortunately, usin apt-key adv is slow, and is failing sometimes, causing
// spurious pipelines failures. The action is hard-coding the key here to
// mitigate this issue.
const openRoboticsAptPublicGpgKey = `
-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: GnuPG v1

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
=9IZg
-----END PGP PUBLIC KEY BLOCK-----
`;

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
		"ca-certificates",
		"curl",
		"gnupg2",
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
 * Add OSRF APT repository key.
 *
 * This is necessary even when building from source to install colcon, vcs, etc.
 */
async function addAptRepoKey(): Promise<void> {
	const workspace = process.env.GITHUB_WORKSPACE as string;
	const keyFilePath = path.join(workspace, "ros.key");
	fs.writeFileSync(keyFilePath, openRoboticsAptPublicGpgKey);
	await utils.exec("sudo", ["apt-key", "add", keyFilePath]);
}

/**
 * Add ROS-O (ROS One) APT repository key.
 *
 * Downloads and installs the GPG key for the ROS-O repository.
 */
async function addRosOneAptRepoKey(): Promise<void> {
	// Ensure the keyrings directory exists and ca-certificates is up to date
	await utils.exec("sudo", ["mkdir", "-p", "/etc/apt/keyrings"]);
	await utils.exec("sudo", ["update-ca-certificates"]);
	await utils.exec("sudo", [
		"bash",
		"-c",
		"curl -sSL https://ros.packages.techfak.net/gpg.key -o /etc/apt/keyrings/ros-one-keyring.gpg",
	]);
}

// Ubuntu distribution for ROS 1
const ros1UbuntuVersion = "focal";

/**
 * Add OSRF APT repository.
 *
 * @param ubuntuCodename the Ubuntu version codename
 * @param needsRos1 whether ROS 1 packages are needed
 * @param needsRos2 whether ROS 2 packages are needed
 */
async function addAptRepo(
	ubuntuCodename: string,
	use_ros2_testing: boolean,
	needsRos1: boolean,
	needsRos2: boolean,
): Promise<void> {
	// Add ROS 1 repository if needed
	if (needsRos1) {
		await utils.exec("sudo", [
			"bash",
			"-c",
			`echo "deb http://packages.ros.org/ros/ubuntu ${ubuntuCodename} main" > /etc/apt/sources.list.d/ros-latest.list`,
		]);
	}

	// Add ROS 2 repository if needed
	if (needsRos2) {
		await utils.exec("sudo", [
			"bash",
			"-c",
			`echo "deb http://packages.ros.org/ros2${
				use_ros2_testing ? "-testing" : ""
			}/ubuntu ${ubuntuCodename} main" > /etc/apt/sources.list.d/ros2-latest.list`,
		]);
	}

	await utils.exec("sudo", ["apt-get", "update"]);
}

/**
 * Add ROS-O (ROS One) APT repository.
 *
 * @param ubuntuCodename the Ubuntu version codename
 * @param use_testing whether to use the testing repository
 */
async function addRosOneAptRepo(
	ubuntuCodename: string,
	use_testing: boolean,
): Promise<void> {
	const arch = await utils.getArch();
	const repo = use_testing ? `${ubuntuCodename}-testing` : ubuntuCodename;
	await utils.exec("sudo", [
		"bash",
		"-c",
		`echo "deb [arch=${arch} signed-by=/etc/apt/keyrings/ros-one-keyring.gpg] https://ros.packages.techfak.net ${repo} main" > /etc/apt/sources.list.d/ros-one.list`,
	]);
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
 * Configure rosdep for ROS-O (ROS One).
 *
 * Adds custom rosdep source for ROS-O packages.
 */
async function configureRosOneRosdep(): Promise<void> {
	await utils.exec("sudo", [
		"bash",
		"-c",
		'echo "yaml https://ros.packages.techfak.net/ros-one.yaml one" > /etc/ros/rosdep/sources.list.d/1-ros-one.list',
	]);
}

/**
 * Install ROS 1 or 2 (development packages and/or ROS binaries) on a Linux worker.
 */
export async function runLinux(): Promise<void> {
	// Get user input & validate
	const use_ros2_testing = core.getInput("use-ros2-testing") === "true";
	const installConnext = core.getInput("install-connext") === "true";

	const requiredDistros = utils.getRequiredRosDistributions();
	const needsRosOne = requiredDistros.includes("one");

	// Determine which ROS versions are needed
	// ROS 1 distributions: noetic (from packages.ros.org/ros)
	// ROS 2 distributions: rolling, humble, jazzy, iron, kilted, etc. (from packages.ros.org/ros2)
	// ROS-O "one": separate repository (ros.packages.techfak.net)
	const ros1Distros = ["noetic"];
	const needsRos1 = requiredDistros.some((distro) =>
		ros1Distros.includes(distro),
	);
	const needsRos2 = requiredDistros.some(
		(distro) => !ros1Distros.includes(distro) && distro !== "one",
	);

	await configOs();

	await addAptRepoKey();

	const ubuntuCodename = await utils.determineDistribCodename();
	// For backward compatibility when no ROS distributions are specified:
	// - Focal (Ubuntu 20.04): add ROS 1 repository (for focal-specific dependencies)
	// - Other versions: add ROS 2 repository (for jammy/noble-specific dependencies)
	// For ROS-O (one): also add ROS 2 repository as it depends on ROS 2 packages
	const addRos1Repo = needsRos1 || ubuntuCodename === ros1UbuntuVersion;
	const addRos2Repo =
		needsRos2 ||
		needsRosOne ||
		(requiredDistros.length === 0 && ubuntuCodename !== ros1UbuntuVersion);
	await addAptRepo(ubuntuCodename, use_ros2_testing, addRos1Repo, addRos2Repo);

	// Add ROS-O repository if needed
	if (needsRosOne) {
		await addRosOneAptRepoKey();
		await addRosOneAptRepo(ubuntuCodename, use_ros2_testing);
	}

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

	// Configure rosdep for ROS-O if needed
	if (needsRosOne) {
		await configureRosOneRosdep();
	}

	for (const rosDistro of requiredDistros) {
		await apt.runAptGetInstall([`ros-${rosDistro}-desktop`]);
	}
}

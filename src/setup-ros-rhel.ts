import * as core from "@actions/core";
import * as io from "@actions/io";

import * as dnf from "./package_manager/dnf";
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
		await utils.exec("dnf", [
			"install",
			"--setopt=install_weak_deps=False",
			"--quiet",
			"--assumeyes",
			"sudo",
		]);
	}

	await utils.exec("sudo", ["bash", "-c", "echo 'Etc/UTC' > /etc/timezone"]);

	// Install tools required to configure the worker system.
	await dnf.runDnfInstall(["gnupg2", "langpacks-en", "glibc-langpack-en"]);

	// Select a locale supporting Unicode.
	core.exportVariable("LANG", "en_US.UTF-8");

	// Enforce UTC time for consistency.
	await utils.exec("sudo", ["bash", "-c", "echo 'Etc/UTC' > /etc/timezone"]);
	await utils.exec("sudo", [
		"ln",
		"-sf",
		"/usr/share/zoneinfo/Etc/UTC",
		"/etc/localtime",
	]);
	await dnf.runDnfInstall(["tzdata"]);
}

/**
 * Add OSRF repository.
 */
async function addDnfRepo(): Promise<void> {
	dnf.runDnfInstall(["epel-release"]);

	await utils.exec("bash", [
		"-c",
		"sudo dnf install --setopt=install_weak_deps=False --quiet --assumeyes 'dnf-command(config-manager)'",
	]);

	const version: number = Number(
		(await utils.determineDistribVer()).split(".")[0],
	);

	let extra_repo_name: string = "";

	if (version === 8) {
		extra_repo_name = "powertools";
	} else if (version > 8) {
		extra_repo_name = "crb";
	}

	await utils.exec("sudo", [
		"dnf",
		"config-manager",
		"--set-enabled",
		extra_repo_name,
	]);

	await utils.exec("sudo", [
		"curl",
		"--output",
		"/etc/yum.repos.d/ros2.repo",
		"http://packages.ros.org/ros2/rhel/ros2.repo",
	]);

	await utils.exec("sudo", ["dnf", "makecache", "--assumeyes"]);
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
 * Install ROS 2 (development packages and/or ROS binaries) on a Linux worker.
 */
export async function runLinux(): Promise<void> {
	await configOs();

	await addDnfRepo();

	// Install development-related packages and some common dependencies
	await dnf.installDnfDependencies();

	await rosdepInit();

	for (const rosDistro of utils.getRequiredRosDistributions()) {
		await dnf.runDnfInstall([`ros-${rosDistro}-desktop`]);
	}
}

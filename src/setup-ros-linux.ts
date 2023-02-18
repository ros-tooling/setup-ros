import * as core from "@actions/core";
import * as io from "@actions/io";

import * as apt from "./package_manager/apt";
import * as pip from "./package_manager/pip";
import * as utils from "./utils";

import * as path from "path";
import fs from "fs";

// Open Robotics APT Repository public GPG key, as retrieved by
//
// $ apt-key adv --refresh-keys --keyserver hkp://keyserver.ubuntu.com:80 \
//     C1CF6E31E6BADE8868B172B4F42ED6FBAB17C654
// See also http://packages.ros.org/ros.asc (caution, this is an HTTP URL)
//
// Unfortunately, usin apt-key adv is slow, and is failing sometimes, causing
// spurious pipelines failures. The action is hard-coding the key here to
// mitigate this issue.
const openRoboticsAptPublicGpgKey = `
-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: GnuPG v1

mQINBFzvJpYBEADY8l1YvO7iYW5gUESyzsTGnMvVUmlV3XarBaJz9bGRmgPXh7jc
VFrQhE0L/HV7LOfoLI9H2GWYyHBqN5ERBlcA8XxG3ZvX7t9nAZPQT2Xxe3GT3tro
u5oCR+SyHN9xPnUwDuqUSvJ2eqMYb9B/Hph3OmtjG30jSNq9kOF5bBTk1hOTGPH4
K/AY0jzT6OpHfXU6ytlFsI47ZKsnTUhipGsKucQ1CXlyirndZ3V3k70YaooZ55rG
aIoAWlx2H0J7sAHmqS29N9jV9mo135d+d+TdLBXI0PXtiHzE9IPaX+ctdSUrPnp+
TwR99lxglpIG6hLuvOMAaxiqFBB/Jf3XJ8OBakfS6nHrWH2WqQxRbiITl0irkQoz
pwNEF2Bv0+Jvs1UFEdVGz5a8xexQHst/RmKrtHLct3iOCvBNqoAQRbvWvBhPjO/p
V5cYeUljZ5wpHyFkaEViClaVWqa6PIsyLqmyjsruPCWlURLsQoQxABcL8bwxX7UT
hM6CtH6tGlYZ85RIzRifIm2oudzV5l+8oRgFr9yVcwyOFT6JCioqkwldW52P1pk/
/SnuexC6LYqqDuHUs5NnokzzpfS6QaWfTY5P5tz4KHJfsjDIktly3mKVfY0fSPVV
okdGpcUzvz2hq1fqjxB6MlB/1vtk0bImfcsoxBmF7H+4E9ZN1sX/tSb0KQARAQAB
tCZPcGVuIFJvYm90aWNzIDxpbmZvQG9zcmZvdW5kYXRpb24ub3JnPokCVAQTAQgA
PgIbAwULCQgHAgYVCgkICwIEFgIDAQIeAQIXgBYhBMHPbjHmut6IaLFytPQu1vur
F8ZUBQJgsdhRBQkLTMW7AAoJEPQu1vurF8ZUTMwP/3f7EkOPIFjUdRmpNJ2db4iB
RQu5b2SJRG+KIdbvQBzKUBMV6/RUhEDPjhXZI3zDevzBewvAMKkqs2Q1cWo9WV7Z
PyTkvSyey/Tjn+PozcdvzkvrEjDMftIk8E1WzLGq7vnPLZ1q/b6Vq4H373Z+EDWa
DaDwW72CbCBLWAVtqff80CwlI2x8fYHKr3VBUnwcXNHR4+nRABfAWnaU4k+oTshC
Qucsd8vitNfsSXrKuKyz91IRHRPnJjx8UvGU4tRGfrHkw1505EZvgP02vXeRyWBR
fKiL1vGy4tCSRDdZO3ms2J2m08VPv65HsHaWYMnO+rNJmMZj9d9JdL/9GRf5F6U0
quoIFL39BhUEvBynuqlrqistnyOhw8W/IQy/ymNzBMcMz6rcMjMwhkgm/LNXoSD1
1OrJu4ktQwRhwvGVarnB8ihwjsTxZFylaLmFSfaA+OAlOqCLS1OkIVMzjW+Ul6A6
qjiCEUOsnlf4CGlhzNMZOx3low6ixzEqKOcfECpeIj80a2fBDmWkcAAjlHu6VBhA
TUDG9e2xKLzV2Z/DLYsb3+n9QW7KO0yZKfiuUo6AYboAioQKn5jh3iRvjGh2Ujpo
22G+oae3PcCc7G+z12j6xIY709FQuA49dA2YpzMda0/OX4LP56STEveDRrO+CnV6
WE+F5FaIKwb72PL4rLi4
=i0tj
-----END PGP PUBLIC KEY BLOCK-----
`;

// List of linux distributions that need http://packages.ros.org/ros/ubuntu APT repo
const distrosRequiringRosUbuntu = ["bionic", "focal"];

const distroPipPackages = {
	default: [
		"argcomplete",
		"colcon-bash==0.4.2",
		"colcon-cd==0.1.1",
		"colcon-cmake==0.2.27",
		"colcon-common-extensions==0.3.0",
		"colcon-core==0.11.0",
		"colcon-coveragepy-result==0.0.8",
		"colcon-defaults==0.2.7",
		"colcon-lcov-result==0.5.0",
		"colcon-library-path==0.2.1",
		"colcon-meson==0.4.2",
		"colcon-metadata==0.2.5",
		"colcon-mixin==0.2.2",
		"colcon-notification==0.2.15",
		"colcon-output==0.2.12",
		"colcon-package-information==0.3.3",
		"colcon-package-selection==0.2.10",
		"colcon-parallel-executor==0.2.4",
		"colcon-pkg-config==0.1.0",
		"colcon-powershell==0.3.7",
		"colcon-python-setup-py==0.2.7",
		"colcon-recursive-crawl==0.2.1",
		"colcon-ros==0.3.23",
		"colcon-test-result==0.3.8",
		"coverage",
		"cryptography",
		"empy",
		"flake8<3.8",
		"flake8-blind-except",
		"flake8-builtins",
		"flake8-class-newline",
		"flake8-comprehensions",
		"flake8-deprecated",
		"flake8-docstrings",
		"flake8-import-order",
		"flake8-quotes",
		"ifcfg",
		"importlib-metadata==2.*",
		"importlib-resources",
		"lark-parser",
		"mock",
		"mypy",
		"nose",
		"numpy",
		"pep8",
		"pydocstyle",
		"pyopenssl",
		"pyparsing",
		"pytest",
		"pytest-cov",
		"pytest-mock",
		"pytest-repeat",
		"pytest-rerunfailures",
		"pytest-runner",
		"setuptools<60.0",
		"wheel",
	],
	jammy: [],
};

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
			"sudo",
		]);
	}

	// Get user input & validate
	const use_ros2_testing = core.getInput("use-ros2-testing") === "true";
	const installConnext = core.getInput("install-connext") === "true";

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

	// OSRF APT repository is necessary, even when building
	// from source to install colcon, vcs, etc.
	const workspace = process.env.GITHUB_WORKSPACE as string;
	const keyFilePath = path.join(workspace, "ros.key");
	fs.writeFileSync(keyFilePath, openRoboticsAptPublicGpgKey);
	await utils.exec("sudo", ["apt-key", "add", keyFilePath]);

	const distribCodename = await utils.determineDistribCodename();
	if (distrosRequiringRosUbuntu.includes(distribCodename)) {
		await utils.exec("sudo", [
			"bash",
			"-c",
			`echo "deb http://packages.ros.org/ros/ubuntu ${distribCodename} main" > /etc/apt/sources.list.d/ros-latest.list`,
		]);
	}
	await utils.exec("sudo", [
		"bash",
		"-c",
		`echo "deb http://packages.ros.org/ros2${
			use_ros2_testing ? "-testing" : ""
		}/ubuntu ${distribCodename} main" > /etc/apt/sources.list.d/ros2-latest.list`,
	]);

	await utils.exec("sudo", ["apt-get", "update"]);
	await utils.exec("sudo", ["apt-get", "upgrade", "-y"]);

	// Install rosdep and vcs, as well as FastRTPS dependencies, OpenSplice, and
	// optionally RTI Connext.
	// vcs dependencies (e.g. git), as well as base building packages are not pulled by rosdep, so
	// they are also installed during this stage.
	await apt.installAptDependencies(installConnext);

	/* Get the latest version of pip before installing dependencies,
	the version from apt can be very out of date (v9.0 on bionic)
	The latest version of pip doesn't support Python3.5 as of v21,
	but pip 9 doesn't understand the metadata that states this, so we must first
	make an intermediate upgrade to pip 20, which does understand that information */
	await pip.runPython3PipInstall(["pip==20.*"]);
	await pip.runPython3PipInstall(["pip"]);

	/* pip3 dependencies need to be installed after the APT ones, as pip3
	modules such as cryptography requires python-dev to be installed,
	because they rely on Python C headers. */
	const pipPackages =
		distroPipPackages[distribCodename] || distroPipPackages.default;
	await pip.installPython3Dependencies(true, pipPackages);

	// Initializes rosdep, trying to remove the default file first in case this environment has already done a rosdep init before
	await utils.exec("sudo", [
		"bash",
		"-c",
		"rm /etc/ros/rosdep/sources.list.d/20-default.list || true",
	]);
	await utils.exec("sudo", ["rosdep", "init"]);

	for (const rosDistro of utils.getRequiredRosDistributions()) {
		await apt.runAptGetInstall([`ros-${rosDistro}-desktop`]);
	}
}

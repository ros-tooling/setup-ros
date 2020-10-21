import * as core from "@actions/core";
import * as exec from "@actions/exec";
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
tCZPcGVuIFJvYm90aWNzIDxpbmZvQG9zcmZvdW5kYXRpb24ub3JnPokCVAQTAQoA
PhYhBMHPbjHmut6IaLFytPQu1vurF8ZUBQJc7yaWAhsDBQkDwmcABQsJCAcCBhUK
CQgLAgQWAgMBAh4BAheAAAoJEPQu1vurF8ZUkhIP/RbZY1ErvCEUy8iLJm9aSpLQ
nDZl5xILOxyZlzpg+Ml5bb0EkQDr92foCgcvLeANKARNCaGLyNIWkuyDovPV0xZJ
rEy0kgBrDNb3++NmdI/+GA92pkedMXXioQvqdsxUagXAIB/sNGByJEhs37F05AnF
vZbjUhceq3xTlvAMcrBWrgB4NwBivZY6IgLvl/CRQpVYwANShIQdbvHvZSxRonWh
NXr6v/Wcf8rsp7g2VqJ2N2AcWT84aa9BLQ3Oe/SgrNx4QEhA1y7rc3oaqPVu5ZXO
K+4O14JrpbEZ3Xs9YEjrcOuEDEpYktA8qqUDTdFyZrxb9S6BquUKrA6jZgT913kj
J4e7YAZobC4rH0w4u0PrqDgYOkXA9Mo7L601/7ZaDJob80UcK+Z12ZSw73IgBix6
DiJVfXuWkk5PM2zsFn6UOQXUNlZlDAOj5NC01V0fJ8P0v6GO9YOSSQx0j5UtkUbR
fp/4W7uCPFvwAatWEHJhlM3sQNiMNStJFegr56xQu1a/cbJH7GdbseMhG/f0BaKQ
qXCI3ffB5y5AOLc9Hw7PYiTFQsuY1ePRhE+J9mejgWRZxkjAH/FlAubqXkDgterC
h+sLkzGf+my2IbsMCuc+3aeNMJ5Ej/vlXefCH/MpPWAHCqpQhe2DET/jRSaM53US
AHNx8kw4MPUkxExgI7Sd
=4Ofr
-----END PGP PUBLIC KEY BLOCK-----
`;

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

	await utils.exec("sudo", ["apt", "update"]);

	// Install tools required to configure the worker system.
	await apt.runAptGetInstall([
		"curl",
		"gnupg2",
		"locales",
		"lsb-release",
		"tzdata",
	]);

	// Select a locale supporting Unicode.
	await utils.exec("sudo", ["locale-gen", "en_US", "en_US.UTF-8"]);
	core.exportVariable("LANG", "en_US.UTF-8");

	// Enforce UTC time for consistency.
	await utils.exec("sudo", ["timedatectl", "set-timezone", "UTC"]);

	// OSRF APT repository is necessary, even when building
	// from source to install colcon, vcs, etc.
	const workspace = process.env.GITHUB_WORKSPACE as string;
	const keyFilePath = path.join(workspace, "ros.key");
	fs.writeFileSync(keyFilePath, openRoboticsAptPublicGpgKey);
	await utils.exec("sudo", ["apt-key", "add", keyFilePath]);

	let ubuntuDistro = "";
	await utils.exec("lsb_release", ["-sc"], {
		listeners: { stdline: (x) => (ubuntuDistro = x) },
	});

	await exec.exec("sudo", ["tee", "/etc/apt/sources.list.d/ros-latest.list"], {
		input: Buffer.from(
			`deb http://packages.ros.org/ros/ubuntu ${ubuntuDistro} main`
		),
	});
	await exec.exec("sudo", ["tee", "/etc/apt/sources.list.d/ros2-latest.list"], {
		input: Buffer.from(
			`deb http://packages.ros2.org/ros/ubuntu ${ubuntuDistro} main`
		),
	});
	await utils.exec("sudo", ["apt-get", "update"]);

	// Install rosdep and vcs, as well as FastRTPS dependencies, OpenSplice, and RTI Connext.
	// vcs dependencies (e.g. git), as well as base building packages are not pulled by rosdep, so
	// they are also installed during this stage.
	await apt.installAptDependencies();

	// pip3 dependencies need to be installed after the APT ones, as pip3
	// modules such as cryptography requires python-dev to be installed,
	// because they rely on Python C headers.
	await pip.installPython3Dependencies();

	// Initializes rosdep
	await utils.exec("sudo", ["rosdep", "init"]);

	for (let rosDistro of utils.getRequiredRosDistributions()) {
		await apt.runAptGetInstall([`ros-${rosDistro}-desktop`]);
	}
}

import * as utils from "../utils";

const dnfCommandLine: string[] = [
	"dnf",
	"install",
	"--setopt=install_weak_deps=False",
	"--quiet",
	"--assumeyes",
];

const dnfDependencies: string[] = [
	"openssl-devel", // required for pip3 cryptography module
	"python3-devel", // required for pip3 cryptography module
	"clang",
	"lcov",
];

const distributionSpecificDnfDependencies = {
	8: [
		// Basic development packages (from ROS 2 source/development setup instructions)
		// ros-dev-tools includes many packages that we needed to include manually in Focal & older
		"python3-flake8-docstrings",
		"python3-pip",
		"python3-pytest-cov",
		"python3-pytest-repeat",
		"python3-pytest-rerunfailures",
		"ros-dev-tools",
		// Additional colcon packages (not included in ros-dev-tools)
		"python3-colcon-coveragepy-result",
		"python3-colcon-lcov-result",
		"python3-colcon-mixin",
		// FastRTPS dependencies
		"tinyxml2-devel",
		// Others
		"curl",
	],
	9: [
		// Basic development packages (from ROS 2 source/development setup instructions)
		// ros-dev-tools includes many packages that we needed to include manually in Focal & older
		"python3-pip",
		"python3-pytest-cov",
		"python3-pytest-repeat",
		"python3-pytest-rerunfailures",
		"ros-build-essential",
		"python3-colcon-common-extensions",
		"python3-colcon-mixin",
		"python3-rosdep",
		"python3-vcstool",
		// Additional colcon packages (not included in ros-dev-tools)
		"python3-colcon-coveragepy-result",
		"python3-colcon-lcov-result",
		// Others
		"python3-importlib-metadata",
		"curl-minimal",
	],
};

/**
 * Run dnf install on list of specified packages.
 *
 * This invocation guarantees that dnf install will be non-blocking.
 *
 * @param   packages        list of RPM packages to be installed
 * @returns Promise<number> exit code
 */
export async function runDnfInstall(packages: string[]): Promise<number> {
	return utils.exec("sudo", dnfCommandLine.concat(packages));
}

/**
 * Run ROS 2 dnf dependencies.
 *
 * @returns Promise<number> exit code
 */
export async function installDnfDependencies(): Promise<number> {
	const distribVer = await utils.determineDistribVer();
	const distribVerMaj = distribVer.split(".")[0];
	let dnfPackages: string[] = dnfDependencies;
	const additionalDnfPackages =
		distributionSpecificDnfDependencies[distribVerMaj] || [];
	dnfPackages = dnfPackages.concat(additionalDnfPackages);
	return runDnfInstall(dnfPackages);
}

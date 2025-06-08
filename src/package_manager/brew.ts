import * as utils from "../utils";

const brewDependencies: string[] = [
	"asio",
	"assimp",
	"bison",
	"bullet",
	"console_bridge",
	"cppcheck",
	"cunit",
	"eigen",
	"freetype",
	"log4cxx",
	"opencv",
	"openssl",
	"osrf/simulation/tinyxml1",
	"pcre",
	"poco",
	"python@3.10",
	"qt",
	"spdlog",
	"tinyxml2",
	"wget",
	"lcov",
];

/**
 * Run brew install on a list of specified packages.
 *
 * @param   packages        list of Homebrew packages to be installed
 * @returns Promise<number> exit code
 */
export async function runBrew(packages: string[]): Promise<number> {
	return utils.exec("brew", ["install"].concat(packages));
}

/**
 * Run ROS 2 Homebrew dependencies.
 *
 * @returns Promise<number> exit code
 */
export async function installBrewDependencies(): Promise<number> {
	// brew now only offers CMake >=4, so manually use an older formula to install version 3.31.1
	let ret = await utils.exec("brew", ["unlink", "cmake"]);
	ret += await utils.exec("curl", [
		"-O",
		"https://raw.githubusercontent.com/Homebrew/homebrew-core/4cfc96448e261e9b16d9b51dc6d563c717003bfd/Formula/c/cmake.rb",
	]);
	ret += await runBrew(["./cmake.rb"]);
	ret += await runBrew(brewDependencies);
	return ret;
}

/**
 * Set python path to pin specific python.
 *
 * @returns Promise<number> exit code
 */
export async function setupPython(): Promise<number> {
	await utils.exec("find", [
		"/usr/local/bin",
		"-lname",
		"'*/Library/Frameworks/Python.framework/*'",
		"-delete",
	]);
	await utils.exec("sudo", [
		"rm",
		"-rf",
		"/Library/Frameworks/Python.framework/",
	]);
	await utils.exec("brew", ["unlink", "python"]);
	return utils.exec("ln", [
		"-s",
		"/opt/homebrew/bin/pip3.10",
		"/opt/homebrew/bin/pip3",
	]);
}

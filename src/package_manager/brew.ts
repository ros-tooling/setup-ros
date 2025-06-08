import * as utils from "../utils";

const brewDependencies: string[] = [
	"asio",
	"assimp",
	"bison",
	"bullet",
	"cmake",
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
	return runBrew(brewDependencies);
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

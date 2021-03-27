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
	"pcre",
	"poco",
	"python3",
	"qt",
	"spdlog",
	"tinyxml",
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

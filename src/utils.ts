import * as actions_exec from "@actions/exec";
import * as core from "@actions/core";
import * as im from "@actions/exec/lib/interfaces";

/**
 * Execute a command and wrap the output in a log group.
 *
 * @param   commandLine     command to execute (can include additional args). Must be correctly escaped.
 * @param   args            optional arguments for tool. Escaping is handled by the lib.
 * @param   options         optional exec options.  See ExecOptions
 * @param   log_message     log group title.
 * @returns Promise<number> exit code
 */
export async function exec(
	commandLine: string,
	args?: string[],
	options?: im.ExecOptions,
	log_message?: string,
): Promise<number> {
	const argsAsString = (args || []).join(" ");
	const message = log_message || `Invoking "${commandLine} ${argsAsString}"`;
	return core.group(message, () => {
		return actions_exec.exec(commandLine, args, options);
	});
}

export function getRequiredRosDistributions(): string[] {
	let requiredRosDistributionsList: string[] = [];
	const requiredRosDistributions = core.getInput("required-ros-distributions");
	if (requiredRosDistributions) {
		requiredRosDistributionsList = requiredRosDistributions.split(
			RegExp("\\s"),
		);
	}

	if (!validateDistro(requiredRosDistributionsList)) {
		throw new Error("Input has invalid distribution names.");
	}

	return requiredRosDistributionsList;
}

//list of valid linux distributions
const validDistro: string[] = [
	"noetic",
	"one",
	"humble",
	"iron",
	"jazzy",
	"kilted",
	"rolling",
];

//Determine whether all inputs name supported ROS distributions.
export function validateDistro(
	requiredRosDistributionsList: string[],
): boolean {
	for (const rosDistro of requiredRosDistributionsList) {
		if (validDistro.indexOf(rosDistro) <= -1) {
			return false;
		}
	}

	return true;
}

/**
 * Get the output of a given command.
 *
 * @param command the command, which must output something
 * @returns the string output
 */
async function getCommandOutput(command: string): Promise<string> {
	let output = "";
	const options: im.ExecOptions = {};
	options.listeners = {
		stdout: (data: Buffer) => {
			output += data.toString();
		},
	};
	await exec("bash", ["-c", command], options);
	return output.trim();
}

/**
 * Determines the Ubuntu distribution codename.
 *
 * This function directly source /etc/lsb-release instead of invoking
 * lsb-release as the package may not be installed.
 *
 * @returns Promise<string> Ubuntu distribution codename (e.g. "focal")
 */
export async function determineDistribCodename(): Promise<string> {
	return getCommandOutput(
		'source /etc/lsb-release ; echo -n "$DISTRIB_CODENAME"',
	);
}

/**
 * Determines the Linux distribution.
 *
 * @returns Promise<string> Linux distribution (e.g. "ubuntu")
 */
export async function determineDistrib(): Promise<string> {
	return getCommandOutput('source /etc/os-release ; echo -n "$ID"');
}

/**
 * Determines the Linux distribution version.
 *
 * @returns Promise<string> Linux distribution version (e.g. "24.04")
 */
export async function determineDistribVer(): Promise<string> {
	return getCommandOutput('source /etc/os-release ; echo -n "$VERSION_ID"');
}

/**
 * Get the machine architecture according to dpkg.
 *
 * @returns the architecture according to dpkg
 */
export async function getArch(): Promise<string> {
	return getCommandOutput("dpkg --print-architecture");
}

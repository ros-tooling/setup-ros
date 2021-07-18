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
	log_message?: string
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
			RegExp("\\s")
		);
	}

	if (!validateDistro(requiredRosDistributionsList)) {
		throw new Error("Input has invalid distribution names.");
	}

	return requiredRosDistributionsList;
}

//list of valid linux distributions
const validDistro: string[] = [
	"kinetic",
	"lunar",
	"melodic",
	"noetic",
	"dashing",
	"eloquent",
	"foxy",
	"galactic",
	"rolling",
];

//Determine whether all inputs name supported ROS distributions.
export function validateDistro(
	requiredRosDistributionsList: string[]
): boolean {
	for (const rosDistro of requiredRosDistributionsList) {
		if (validDistro.indexOf(rosDistro) <= -1) {
			return false;
		}
	}

	return true;
}

/**
 * Get JSON object if the string is valid.
 *
 * @param str the string
 * @returns the JSON object if valid, `undefined` otherwise
 */
export function getJson(str: string): any | undefined {
	try {
		return JSON.parse(str);
	} catch (e) {
	}
	return undefined;
}

/**
 * Validate snapshots dictionary.
 *
 * The snapshots object must be a {string: string} dictionary.
 * The key must be the name of a distro in the distros array.
 * The value must be either 'final' or a 'yyyy-MM-dd' datestamp.
 * Distros in the distros array don't necessarily need to be in the snapshots dictionary.
 *
 * @param snapshots the snapshots dictionary
 * @param distros the list of distros
 * @returns `true` if valid, `false` otherwise
 */
export function validateSnapshots(snapshots: {[key: string]: string}, distros: string[]): boolean {
	for (let [distro, datestamp] of Object.entries(snapshots)) {
		if (!distros.includes(distro)) {
			return false;
		}
		if (datestamp !== "final" && !/[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(datestamp)) {
			return false;
		}
	}
	return true;
}

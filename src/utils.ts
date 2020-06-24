import * as actions_exec from "@actions/exec";
import * as core from "@actions/core";
import * as im from "@actions/exec/lib/interfaces";
import * as tr from "@actions/exec/lib/toolrunner";

// eslint-disable-line @typescript-eslint/no-unused-vars

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
];

//Determine whether all inputs name supported ROS distributions.
export function validateDistro(
	requiredRosDistributionsList: string[]
): boolean {
	for (let rosDistro of requiredRosDistributionsList) {
		if (validDistro.indexOf(rosDistro) <= -1) {
			return false;
		}
	}

	return true;
}

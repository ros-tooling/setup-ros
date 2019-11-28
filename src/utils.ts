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
	return core.group(message, async () => {
		return actions_exec.exec(commandLine, args, options);
	});
}

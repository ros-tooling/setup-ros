import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import * as utils from "./utils";

// Pixi-based binary releases; humble and iron are not supported.
const binaryReleases: { [index: string]: string } = {
	jazzy:
		"https://github.com/ros2/ros2/releases/download/release-jazzy-20250430/ros2-jazzy-20250407-windows-release-amd64.zip",
	kilted:
		"https://github.com/ros2/ros2/releases/download/release-kilted-20250523/ros2-kilted-20250523-windows-release-amd64.zip",
	lyrical:
		"https://github.com/ros2/ros2/releases/download/release-lyrical-beta-20260430/ros2-lyrical-2026-04-30-windows-AMD64.zip",
	rolling:
		"https://github.com/ros2/ros2/releases/download/release-rolling-nightlies/ros2-rolling-nightly-windows-amd64.zip",
};

const pixiWorkspace = "C:\\pixi_ws";

async function installPixi() {
	await utils.exec("powershell", [
		"-ExecutionPolicy",
		"ByPass",
		"-Command",
		"irm -useb https://pixi.sh/install.ps1 | iex",
	]);
	core.addPath(path.join(os.homedir(), ".pixi", "bin"));
}

/**
 * Install ROS 2 binary releases and their pixi environments.
 */
async function prepareRos2BinaryReleases() {
	for (const rosDistro of utils.getRequiredRosDistributions()) {
		if (!(rosDistro in binaryReleases)) {
			core.warning(`No Windows binary release available for ${rosDistro}`);
			continue;
		}
		const installDir = path.join(pixiWorkspace, rosDistro);
		const manifestPath = path.join(installDir, "pixi.toml");
		fs.mkdirSync(installDir, { recursive: true });

		await tc.downloadTool(
			`https://raw.githubusercontent.com/ros2/ros2/refs/heads/${rosDistro}/pixi.toml`,
			manifestPath,
		);
		const zipPath = await tc.downloadTool(binaryReleases[rosDistro]);
		await tc.extractZip(zipPath, installDir);

		await utils.exec("pixi", ["install", "--manifest-path", manifestPath]);

		const preinstallScript = path.join(
			installDir,
			"ros2-windows",
			"preinstall_setup_windows.py",
		);
		if (fs.existsSync(preinstallScript)) {
			await utils.exec("pixi", [
				"run",
				"--manifest-path",
				manifestPath,
				"python",
				preinstallScript,
			]);
		}
	}
}

/**
 * Install build environment on a Windows worker.
 */
export async function runWindows() {
	await installPixi();
	return await prepareRos2BinaryReleases();
}

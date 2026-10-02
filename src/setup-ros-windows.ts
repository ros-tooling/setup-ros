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

// Windows 11 starts at build 22000; GitHub-hosted runners are Windows Server and will warn.
function checkWindows11() {
	const build = Number(os.release().split(".")[2]);
	if (!(build >= 22000)) {
		core.warning(`ROS 2 binaries only support Windows 11 (found ${os.release()})`);
	}
}

async function findVs2022(): Promise<string> {
	const vswhere = path.join(
		process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)",
		"Microsoft Visual Studio",
		"Installer",
		"vswhere.exe",
	);
	if (!fs.existsSync(vswhere)) {
		return "";
	}

	let installPath = "";
	await utils.exec(
		vswhere,
		[
			"-latest",
			"-products",
			"*",
			"-version",
			"[17.0,18.0)",
			"-requires",
			"Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
			"-property",
			"installationPath",
		],
		{ listeners: { stdout: (d: Buffer) => (installPath += d.toString()) } },
	);
	return installPath.trim();
}

/**
 * Activate the Visual Studio 2022 (MSVC v143) toolchain, installing the Build Tools if missing.
 * VS 18+ is not supported by ROS 2 yet.
 */
async function selectMsvc2022() {
	let installPath = await findVs2022();
	if (!installPath) {
		const bootstrapper = await tc.downloadTool(
			"https://aka.ms/vs/17/release/vs_BuildTools.exe",
			path.join(process.env["RUNNER_TEMP"] || os.tmpdir(), "vs_BuildTools.exe"),
		);
		// 3010 means success, reboot pending.
		const code = await utils.exec(
			bootstrapper,
			[
				"--quiet",
				"--wait",
				"--norestart",
				"--nocache",
				"--add",
				"Microsoft.VisualStudio.Workload.VCTools",
				"--includeRecommended",
			],
			{ ignoreReturnCode: true },
		);
		if (code && code !== 3010) {
			throw new Error(`VS 2022 Build Tools installation failed with exit code ${code}`);
		}
		installPath = await findVs2022();
	}
	if (!installPath) {
		core.warning("Visual Studio 2022 C++ tools not found, skipping MSVC selection");
		return;
	}

	const vcvars = path.join(installPath, "VC", "Auxiliary", "Build", "vcvars64.bat");
	let envDump = "";
	await utils.exec("cmd", ["/d", "/s", "/c", `""${vcvars}" >nul && set"`], {
		windowsVerbatimArguments: true,
		listeners: { stdout: (d: Buffer) => (envDump += d.toString()) },
	});
	for (const line of envDump.split(/\r?\n/)) {
		const i = line.indexOf("=");
		if (i > 0 && process.env[line.slice(0, i)] !== line.slice(i + 1)) {
			core.exportVariable(line.slice(0, i), line.slice(i + 1));
		}
	}
}

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
	checkWindows11();
	await selectMsvc2022();
	await installPixi();
	return await prepareRos2BinaryReleases();
}

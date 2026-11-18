import * as child_process from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { getRosAptSourceInstallScript } from "../src/setup-ros-ubuntu";

// The script runs with bash and reads /etc/os-release, so only run on Linux.
const describeOnLinux = process.platform === "linux" ? describe : describe.skip;

const latestRelease =
	"https://github.com/ros-infrastructure/ros-apt-source/releases/latest";

// Fake curl: the version lookup prints the URL it was "redirected" to
// (FAKE_REDIRECT) or fails like curl --fail does (FAKE_LOOKUP_EXIT). The
// download writes an empty file. Every call is logged.
const fakeCurl = `#!/bin/bash
echo "curl $*" >> "$FAKE_LOG"
for arg in "$@"; do
	if [ "$arg" = "--write-out" ]; then
		if [ -n "$FAKE_LOOKUP_EXIT" ]; then
			echo "curl: (22) The requested URL returned error: 429" >&2
			exit "$FAKE_LOOKUP_EXIT"
		fi
		printf '%s' "$FAKE_REDIRECT"
		exit 0
	fi
done
while [ $# -gt 0 ]; do
	if [ "$1" = "-o" ]; then : > "$2"; fi
	shift
done
`;

// Fake sudo: only logs what it would run.
const fakeSudo = `#!/bin/bash
echo "sudo $*" >> "$FAKE_LOG"
`;

describeOnLinux("ros-apt-source install script", () => {
	let dir: string;
	let log: string;

	beforeEach(() => {
		dir = fs.mkdtempSync(path.join(os.tmpdir(), "setup-ros-test-"));
		log = path.join(dir, "log");
		fs.writeFileSync(path.join(dir, "curl"), fakeCurl, { mode: 0o755 });
		fs.writeFileSync(path.join(dir, "sudo"), fakeSudo, { mode: 0o755 });
	});

	afterEach(() => {
		fs.rmSync(dir, { recursive: true, force: true });
	});

	function run(
		env: Record<string, string>,
	): child_process.SpawnSyncReturns<string> {
		return child_process.spawnSync(
			"bash",
			["-c", getRosAptSourceInstallScript("ros2-apt-source")],
			{
				encoding: "utf8",
				env: {
					...process.env,
					PATH: `${dir}:${process.env.PATH}`,
					FAKE_LOG: log,
					...env,
				},
			},
		);
	}

	function calls(): string[] {
		return fs.existsSync(log)
			? fs.readFileSync(log, "utf8").trim().split("\n")
			: [];
	}

	it("does not use the rate-limited GitHub API", () => {
		expect(getRosAptSourceInstallScript("ros2-apt-source")).not.toContain(
			"api.github.com",
		);
	});

	it("installs the latest release", () => {
		const result = run({
			FAKE_REDIRECT:
				"https://github.com/ros-infrastructure/ros-apt-source/releases/tag/1.3.0",
		});
		expect(result.stderr).toBe("");
		expect(result.status).toBe(0);
		const [lookup, download, install] = calls();
		expect(lookup).toContain(latestRelease);
		expect(download).toMatch(
			/ https:\/\/github\.com\/ros-infrastructure\/ros-apt-source\/releases\/download\/1\.3\.0\/ros2-apt-source_1\.3\.0\.[a-z]+_all\.deb$/,
		);
		expect(install).toBe("sudo dpkg -i /tmp/ros2-apt-source.deb");
	});

	it("fails clearly when the version cannot be determined", () => {
		// No release to redirect to: the URL stays .../releases/latest
		const result = run({ FAKE_REDIRECT: latestRelease });
		expect(result.status).not.toBe(0);
		expect(result.stderr).toContain(
			"Could not determine the latest ros-apt-source version",
		);
		expect(calls()).toHaveLength(1);
	});

	it("fails when the version lookup fails", () => {
		const result = run({ FAKE_LOOKUP_EXIT: "22" });
		expect(result.status).toBe(22);
		expect(calls()).toHaveLength(1);
	});
});

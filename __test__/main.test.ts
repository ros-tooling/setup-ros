import * as core from "@actions/core";
import * as actions_exec from "@actions/exec";

import * as ubuntu from "../src/setup-ros-ubuntu";
import * as rhel from "../src/setup-ros-rhel";
import * as osx from "../src/setup-ros-osx";
import * as windows from "../src/setup-ros-windows";

import * as utils from "../src/utils";

describe("basic workflow tests", () => {
	beforeAll(() => {
		jest.spyOn(actions_exec, "exec").mockImplementation(jest.fn());
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	it("run Ubuntu workflow", async () => {
		await expect(ubuntu.runLinux()).resolves.not.toThrow();
	});

	it("run RHEL workflow", async () => {
		await expect(rhel.runLinux()).resolves.not.toThrow();
	});

	it("run Windows workflow", async () => {
		await expect(windows.runWindows()).resolves.not.toThrow();
	});

	it("run macOS workflow", async () => {
		await expect(osx.runOsX()).resolves.not.toThrow();
	});
});

describe("required-ros-distributions/noetic workflow tests", () => {
	beforeAll(() => {
		jest.spyOn(actions_exec, "exec").mockImplementation(jest.fn());
		jest.spyOn(core, "getInput").mockReturnValue("noetic");
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	it("run Ubuntu workflow", async () => {
		await expect(ubuntu.runLinux()).resolves.not.toThrow();
	});

	it("run RHEL workflow", async () => {
		await expect(rhel.runLinux()).resolves.not.toThrow();
	});

	it("run Windows workflow", async () => {
		await expect(windows.runWindows()).resolves.not.toThrow();
	});

	it("run macOS workflow", async () => {
		await expect(osx.runOsX()).resolves.not.toThrow();
	});
});

describe("validate distribution test", () => {
	it("test valid", async () => {
		await expect(utils.validateDistro(["noetic"])).toBe(true);
		await expect(utils.validateDistro(["one"])).toBe(true);
		await expect(utils.validateDistro(["humble"])).toBe(true);
		await expect(utils.validateDistro(["iron"])).toBe(true);
		await expect(utils.validateDistro(["jazzy"])).toBe(true);
		await expect(utils.validateDistro(["kilted"])).toBe(true);
		await expect(utils.validateDistro(["rolling"])).toBe(true);
	});

	it("test not valid", async () => {
		//ROS1 End-of-Life
		await expect(utils.validateDistro(["box"])).toBe(false);
		await expect(utils.validateDistro(["c"])).toBe(false);
		await expect(utils.validateDistro(["diamondback"])).toBe(false);
		await expect(utils.validateDistro(["electric"])).toBe(false);
		await expect(utils.validateDistro(["fuerte"])).toBe(false);
		await expect(utils.validateDistro(["groovy"])).toBe(false);
		await expect(utils.validateDistro(["hydro"])).toBe(false);
		await expect(utils.validateDistro(["indigo"])).toBe(false);
		await expect(utils.validateDistro(["jade"])).toBe(false);
		await expect(utils.validateDistro(["kinetic"])).toBe(false);
		await expect(utils.validateDistro(["lunar"])).toBe(false);
		await expect(utils.validateDistro(["melodic"])).toBe(false);
		//ROS2 End-of-Life
		await expect(utils.validateDistro(["ardent"])).toBe(false);
		await expect(utils.validateDistro(["bouncy"])).toBe(false);
		await expect(utils.validateDistro(["crystal"])).toBe(false);
		await expect(utils.validateDistro(["dashing"])).toBe(false);
		await expect(utils.validateDistro(["eloquent"])).toBe(false);
		await expect(utils.validateDistro(["foxy"])).toBe(false);
		await expect(utils.validateDistro(["galactic"])).toBe(false);
		// Does not exist or not all valid
		await expect(utils.validateDistro(["foxy", "doesntexist"])).toBe(false);
		await expect(utils.validateDistro(["master"])).toBe(false);
	});
});

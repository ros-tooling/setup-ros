import * as core from "@actions/core";
import * as actions_exec from "@actions/exec";

import * as linux from "../src/setup-ros-linux";
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

	it("run Linux workflow", async () => {
		await expect(linux.runLinux()).resolves.not.toThrow();
	});

	it("run Windows workflow", async () => {
		await expect(windows.runWindows()).resolves.not.toThrow();
	});

	it("run macOS workflow", async () => {
		await expect(osx.runOsX()).resolves.not.toThrow();
	});
});

describe("required-ros-distributions/melodic workflow tests", () => {
	beforeAll(() => {
		jest.spyOn(actions_exec, "exec").mockImplementation(jest.fn());
		jest.spyOn(core, "getInput").mockReturnValue("melodic");
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	it("run Linux workflow", async () => {
		await expect(linux.runLinux()).resolves.not.toThrow();
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
		await expect(utils.validateDistro(["melodic"])).toBe(true);
		await expect(utils.validateDistro(["noetic"])).toBe(true);
		await expect(utils.validateDistro(["foxy"])).toBe(true);
		await expect(utils.validateDistro(["galactic"])).toBe(true);
		await expect(utils.validateDistro(["humble"])).toBe(true);
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
		//ROS2 End-of-Life
		await expect(utils.validateDistro(["ardent"])).toBe(false);
		await expect(utils.validateDistro(["bouncy"])).toBe(false);
		await expect(utils.validateDistro(["crystal"])).toBe(false);
		await expect(utils.validateDistro(["dashing"])).toBe(false);
		await expect(utils.validateDistro(["eloquent"])).toBe(false);
		// Does not exist or not all valid
		await expect(utils.validateDistro(["foxy", "doesntexist"])).toBe(false);
		await expect(utils.validateDistro(["master"])).toBe(false);
	});
});

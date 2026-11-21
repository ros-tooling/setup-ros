module.exports = {
	clearMocks: true,
	moduleFileExtensions: ["js", "ts"],
	resolver: "<rootDir>/jest.resolver.js",
	testEnvironment: "node",
	testMatch: ["**/*.test.ts"],
	testRunner: "jest-circus/runner",
	transform: {
		"^.+\\.ts$": "ts-jest",
		// Transpile the ESM-only @actions/* packages to CommonJS
		"^.+\\.js$": [
			"ts-jest",
			{ tsconfig: { allowJs: true, isolatedModules: true } },
		],
	},
	transformIgnorePatterns: ["/node_modules/(?!@actions/)"],
	verbose: true,
};

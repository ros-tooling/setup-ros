module.exports = {
	"*": [
		"eslint --cache --fix --config .eslintrc.json",
		"prettier --write --config .prettierrc --ignore-path .prettierignore --ignore-unknown",
		// Note: doing the build here ensures we omit unstaged changes
		() => "npm run build",
		() => "git add dist/index.js",
	],
};

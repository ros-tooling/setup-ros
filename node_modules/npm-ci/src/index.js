var suma = function(a, b) {
	return a + b;
};

var resta = function(a, b) {
	return a - b;
};

var mult = function(a, b) {
	return a * b;
};

var div = function(a, b) {
	if(b === 0) throw Error("Division by zero");
	return a / b;
};

var mod = function(a, b) {
	return a % b;
};

module.exports = {
	suma: suma,
	resta: resta,
	mult: mult,
	div: div,
	mod: mod
};

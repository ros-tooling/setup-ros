var operations = require('../src/index');
var assert = require('assert');

describe("Suma", function() {
	it("Deberia retornar un resultado correcto al sumar dos numeros", function() {
		assert.equal(2, operations.suma(1, 1));
	});

	it("Deberia retornar un resultado correcto al sumar numeros negativos", function() {
		assert.equal(2, operations.suma(3, -1));
	});
});

describe("Resta", function() {
	it("Deberia retornar un resultado correcto al restar dos numeros", function() {
		assert.equal(0, operations.resta(1, 1));
	});

	it("Deberia retornar un resultado correcto al restar numeros negativos", function() {
		assert.equal(0, operations.resta(-3, -3));
	});
});

describe("Multiplicacion", function() {
	it("Deberia retornar un resultado correcto al multiplcar dos numeros", function() {
		assert.equal(2, operations.mult(1, 2));
	});

	it("Deberia retornar un resultado correcto al multiplicar numeros negativos", function() {
		assert.equal(2, operations.mult(-1, -2));
	});
});

describe("Division", function() {
	it("Deberia retornar un resultado correcto al dividir dos numeros", function() {
		assert.equal(1, operations.div(2, 2));
	});

	it("Deberia retornar un resultado correcto al dividir numeros negativos", function() {
		assert.equal(1, operations.div(-2, -2));
	});

	it("Deberia lanzar una excepcion al dividir por cero", function() {
		assert.throws(function() {
			operations.div(1, 0);
		}, Error);
	});
});

describe("Modulo", function() {
	//it("Deberia retornar un resultado correcto al hacer modulo de numeros", function() {
	//	assert.equal(2, operations.mod(5, 3));
	//});

	//it("Deberia retornar un resultado correcto al hacer modulo de numeros negativos", function() {
	//	assert.equal(-2, operations.mod(-5, 3));
	//});
});

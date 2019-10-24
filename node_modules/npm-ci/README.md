# NPM + GitHub

## Gulp

Gulp es un build system para javascript que prioriza código por sobre configuración. Existen centenares de plugins destinados a distintas tareas como mover archivos, ejecutar tests, calcular la cobertura de los tests, etc...

En _Gulpfile.js_ hay 3 tareas configuradas, dedicadas a ejecutar los tests, calcular la cobertura y enviar los datos a _Coveralls_ (simil Sonar).

## Servicios de GitHub

### Travis ([https://travis-ci.org/](https://travis-ci.org/))

[![Build Status](https://travis-ci.org/gnavalesi/npm-ci.svg?branch=master)](https://travis-ci.org/gnavalesi/npm-ci)

Para configurar _Travis_ hay que habilitar el servicio desde Github y crear el archivo _.travis.yml_ en el directorio raiz de nuestro repositorio. En el caso de este proyecto, el contenido es el siguiente:

```yaml
language: node_js
node_js: "4.4"

before_script:
  - npm install
  - npm install -g gulp

script: gulp ci
```

Cada vez que se haga push, por cada commit _Travis_ instala el proyecto y ejecuta `gulp ci`

### Coveralls ([https://coveralls.io](https://coveralls.io))

[![Coverage Status](https://coveralls.io/repos/github/gnavalesi/npm-ci/badge.svg?branch=master)](https://coveralls.io/github/gnavalesi/npm-ci?branch=master)

Ya tenemos configurada la tarea de _Gulp_ que envía los datos de cobertura a _Coveralls_ para que los analice. Lo único que tenemos que hacer es ingresar al sitio web y habilitar el análisis para el repositorio.

### Code Climate ([https://codeclimate.com](https://codeclimate.com))

[![Code Climate](https://codeclimate.com/github/gnavalesi/npm-ci/badges/gpa.svg)](https://codeclimate.com/github/gnavalesi/npm-ci)

_Code Climate_ permite detectar posibles errores en nuestro código. También permite el análisis de datos de cobertura.

### VersionEye ([https://www.versioneye.com](https://www.versioneye.com))

[![Dependency Status](https://www.versioneye.com/user/projects/5775a70d68ee070047f065c0/badge.svg?style=flat-square)](https://www.versioneye.com/user/projects/5775a70d68ee070047f065c0)

_Version Eye_ analiza las dependencias de nuestro proyecto, detectando nuevas versiones y problemas de seguridad.

## Publicando en npm ([https://www.npmjs.com/](https://www.npmjs.com/))

_(fuente: [https://docs.npmjs.com/getting-started/publishing-npm-packages](https://docs.npmjs.com/))_

Ejecutamos `npm login` para guardar los datos de usuario y luego `npm publish` para publicar el paquete. Podemos ir a [https://www.npmjs.com/package/npm-ci](https://www.npmjs.com/package/npm-ci) para verlo.

Cuando querramos actualizar el paquete, ejecutamos `npm version <tipo>` donde `<tipo>` es el tipo de release, y puede tomar los valores:

* `patch` : (1.0.2 -> 1.0.3)
* `minor` : (1.0.2 -> 1.1.0)
* `major` : (1.0.2 -> 2.0.0)

Luego ejecutamos `npm publish` para publicar la actualizacion en _npm_

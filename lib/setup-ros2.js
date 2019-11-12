"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
function runAptGetInstall(packages) {
    return __awaiter(this, void 0, void 0, function* () {
        return exec.exec("sudo", ["DEBIAN_FRONTEND=noninteractive", "RTI_NC_LICENSE_ACCEPTED=yes",
            "apt-get", "install", "--no-install-recommends", "--quiet",
            "--yes"].concat(packages));
    });
}
function runBrew(packages) {
    return __awaiter(this, void 0, void 0, function* () {
        return exec.exec("brew", ["install"].concat(packages));
    });
}
function installPython3Dependencies() {
    return __awaiter(this, void 0, void 0, function* () {
        return exec.exec("sudo", ["pip3", "install", "--upgrade",
            "argcomplete",
            "catkin_pkg",
            "colcon-common-extensions",
            "colcon-lcov-result",
            "colcon-mixin",
            "coverage",
            "cryptography",
            "empy",
            "flake8",
            "flake8-blind-except",
            "flake8-builtins",
            "flake8-class-newline",
            "flake8-comprehensions",
            "flake8-deprecated",
            "flake8-docstrings",
            "flake8-import-order",
            "flake8-quotes",
            "ifcfg",
            "lark-parser",
            "mock",
            "mypy",
            "nose",
            "pep8",
            "pydocstyle",
            "pyparsing",
            "pytest",
            "pytest-cov",
            "pytest-mock",
            "pytest-repeat",
            "pytest-rerunfailures",
            "pytest-runner",
            "setuptools", "wheel"]);
    });
}
function runLinux() {
    return __awaiter(this, void 0, void 0, function* () {
        yield exec.exec("sudo", ["apt-get", "update"]);
        // Select a locale supporting Unicode.
        yield exec.exec("sudo", ["locale-gen", "en_US", "en_US.UTF-8"]);
        core.exportVariable('LANG', 'en_US.UTF-8');
        // Enforce UTC time for consistency.
        yield exec.exec("sudo", ["bash", "-c", "echo 'Etc/UTC' > /etc/timezone"]);
        yield exec.exec("sudo", ["ln", "-sf", "/usr/share/zoneinfo/Etc/UTC", "/etc/localtime"]);
        yield runAptGetInstall(["tzdata"]);
        // OSRF APT repository is necessary, even when building
        // from source to install colcon, vcs, etc.
        yield runAptGetInstall(["curl", "gnupg2", "lsb-release"]);
        yield exec.exec("sudo", ["apt-key", "adv", "--keyserver", "hkp://keyserver.ubuntu.com:80",
            "--recv-keys", "C1CF6E31E6BADE8868B172B4F42ED6FBAB17C654"]);
        yield exec.exec("sudo", ["bash", "-c",
            `echo "deb http://packages.ros.org/ros2/ubuntu $(lsb_release -sc) main" > /etc/apt/sources.list.d/ros2-latest.list`]);
        yield exec.exec("sudo", ["apt-get", "update"]);
        // Install colcon, rosdep, and vcs.
        // colcon and vcs dependencies (e.g. git), as well as
        // base building packages are not pulled by rosdep, so
        // they are also installed during this stage.
        yield runAptGetInstall(["build-essential", "clang", "cmake", "git", "lcov",
            "python3-colcon-common-extensions", "python3-lark-parser", "python3-pip",
            "python3-rosdep", "python3-vcstool", "wget"]);
        // FastRTPS dependencies
        yield runAptGetInstall(["libasio-dev", "libtinyxml2-dev"]);
        // Install OpenSplice
        yield runAptGetInstall(["libopensplice69"]);
        // Install RTI Connext in a non-interactive way.
        // Skipping the license agreement page requires RTI_NC_LICENSE_ACCEPTED to be
        // set to "yes".
        // This package would normally be installed automatically by rosdep, but
        // there is no way to pass RTI_NC_LICENSE_ACCEPTED through rosdep.
        yield runAptGetInstall(["rti-connext-dds-5.3.1"]);
        yield installPython3Dependencies();
        // Initializes rosdep
        yield exec.exec("sudo", ["rosdep", "init"]);
    });
}
function runOsX() {
    return __awaiter(this, void 0, void 0, function* () {
        yield runBrew([
            "asio",
            "assimp",
            "console_bridge",
            "cppcheck",
            "eigen",
            "freetype",
            "log4cxx",
            "opencv",
            "openssl",
            "pcre",
            "poco",
            "python3",
            "qt",
            "tinyxml",
            "tinyxml2",
            "wget"
        ]);
        yield exec.exec("sudo", [
            "bash",
            "-c",
            "echo \"export OPENSSL_ROOT_DIR=$(brew --prefix openssl)\" >> ~/.bashrc"
        ]);
        yield exec.exec("sudo", [
            "bash",
            "-c",
            "echo \"export CMAKE_PREFIX_PATH=$CMAKE_PREFIX_PATH:/usr/local/opt/qt\" >> ~/.bashrc"
        ]);
        yield exec.exec("sudo", [
            "bash",
            "-c",
            "echo \"export PATH=$PATH:/usr/local/opt/qt/bin\" >> ~/.bashrc"
        ]);
        yield installPython3Dependencies();
        // While rosdep and vcs are available as a Debian package on Ubuntu, they need
        // to be installed through pip on OS X.
        yield exec.exec("sudo", ["pip3", "install", "--upgrade", "rosdep", "vcstool"]);
        // Initializes rosdep
        yield exec.exec("sudo", ["rosdep", "init"]);
    });
}
function runWindows() {
    return __awaiter(this, void 0, void 0, function* () {
        core.setFailed("Windows is not yet supported");
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const platform = process.platform;
            if (platform === "darwin") {
                yield runOsX();
            }
            else if (platform === "win32") {
                yield runWindows();
            }
            else if (platform === "linux") {
                yield runLinux();
            }
            else {
                core.setFailed(`unsupport platform ${platform}`);
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();

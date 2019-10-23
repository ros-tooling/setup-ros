"use strict";
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
    return exec.exec("sudo", ["DEBIAN_FRONTEND=noninteractive", "RTI_NC_LICENSE_ACCEPTED=yes",
        "apt-get", "install", "--no-install-recommends", "--quiet",
        "--yes"].concat(packages));
}
function run() {
    try {
        exec.exec("sudo", ["apt-get", "update"]);
        // Select a locale supporting Unicode.
        exec.exec("sudo", ["locale-gen", "en_US", "en_US.UTF-8"]);
        core.exportVariable('LANG', 'en_US.UTF-8');
        // Enforce UTC time for consistency.
        exec.exec("sudo", ["bash", "-c", "echo 'Etc/UTC' > /etc/timezone"]);
        exec.exec("sudo", ["ln", "-sf", "/usr/share/zoneinfo/Etc/UTC", "/etc/localtime"]);
        runAptGetInstall(["tzdata"]);
        // OSRF APT repository is necessary, even when building
        // from source to install colcon, vcs, etc.
        runAptGetInstall(["curl", "gnupg2", "lsb-release"]);
        exec.exec("sudo", ["apt-key", "adv", "--keyserver", "hkp://keyserver.ubuntu.com:80",
            "--recv-keys", "C1CF6E31E6BADE8868B172B4F42ED6FBAB17C654"]);
        exec.exec("sudo", ["bash", "-c",
            `echo "deb http://packages.ros.org/ros2/ubuntu $(lsb_release -sc) main" > /etc/apt/sources.list.d/ros2-latest.list`]);
        exec.exec("sudo", ["apt-get", "update"]);
        // Install colcon, rosdep, and vcs.
        // colcon and vcs dependencies (e.g. git), as well as
        // base building packages are not pulled by rosdep, so
        // they are also installed during this stage.
        runAptGetInstall(["build-essential", "cmake", "git",
            "python3-colcon-common-extensions", "python3-lark-parser", "python3-pip",
            "python3-rosdep", "python3-vcstool", "wget"]);
        // FastRTPS dependencies
        runAptGetInstall(["libasio-dev", "libtinyxml2-dev"]);
        // Install OpenSplice
        runAptGetInstall(["libopensplice69"]);
        // Install RTI Connext in a non-interactive way.
        // Skipping the license agreement page requires RTI_NC_LICENSE_ACCEPTED to be
        // set to "yes".
        // This package would normally be installed automatically by rosdep, but
        // there is no way to pass RTI_NC_LICENSE_ACCEPTED through rosdep.
        runAptGetInstall(["rti-connext-dds-5.3.1"]);
        // Install all Python 3 dependencies.
        exec.exec("sudo", ["pip3", "install", "--upgrade", "argcomplete", "colcon-common-extensions",
            "colcon-mixin", "flake8", "flake8-blind-except", "flake8-builtins",
            "flake8-class-newline", "flake8-comprehensions", "flake8-deprecated",
            "flake8-docstrings", "flake8-import-order", "flake8-quotes", "pytest",
            "pytest-cov", "pytest-repeat", "pytest-rerunfailures", "pytest-runner",
            "setuptools", "wheel"]);
        // Initializes rosdep
        exec.exec("sudo", ["rosdep", "init"]);
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
run();

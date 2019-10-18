import * as core from "@actions/core";
import * as exec from "@actions/exec";

async function runAptGetInstall(packages: string[]): Promise<number> {
   return exec.exec(
        "sudo",
        ["DEBIAN_FRONTEND=noninteractive", "RTI_NC_LICENSE_ACCEPTED=yes",
         "apt-get", "install", "--no-install-recommends", "--quiet",
         "--yes"].concat(packages)
    )
}

async function run() {
  try {
    await exec.exec("sudo", ["apt-get", "update"]);

    // Select a locale supporting Unicode.
    await exec.exec("sudo", ["locale-gen", "en_US", "en_US.UTF-8"]);
    core.exportVariable('LANG', 'en_US.UTF-8');

    // Enforce UTC time for consistency.
    await exec.exec("sudo", ["bash", "-c", "echo 'Etc/UTC' > /etc/timezone"]);
    await exec.exec(
        "sudo",
        ["ln", "-sf", "/usr/share/zoneinfo/Etc/UTC", "/etc/localtime"])
    await runAptGetInstall(["tzdata"]);

    // OSRF APT repository is necessary, even when building
    // from source to install colcon, vcs, etc.
    await runAptGetInstall(["curl", "gnupg2", "lsb-release"]);
    await exec.exec(
        "sudo",
        ["apt-key", "adv", "--keyserver", "hkp://keyserver.ubuntu.com:80",
         "--recv-keys", "C1CF6E31E6BADE8868B172B4F42ED6FBAB17C654"]);
    await exec.exec(
    "sudo",
    ["bash", "-c",
     `echo "deb http://packages.ros.org/ros2/ubuntu $(lsb_release -sc) main" > /etc/apt/sources.list.d/ros2-latest.list`])
    await exec.exec("sudo", ["apt-get", "update"]);

    // Install colcon, rosdep, and vcs.
    // colcon and vcs dependencies (e.g. git), as well as
    // base building packages are not pulled by rosdep, so
    // they are also installed during this stage.
    await runAptGetInstall(
    ["build-essential", "cmake", "git",
     "python3-colcon-common-extensions", "python3-lark-parser", "python3-pip",
     "python3-rosdep", "python3-vcstool", "wget"])

     // FastRTPS dependencies
    await runAptGetInstall(["libasio-dev", "libtinyxml2-dev"])

    // Install OpenSplice
    await runAptGetInstall(["libopensplice69"])

    // Install RTI Connext in a non-interactive way.
    // Skipping the license agreement page requires RTI_NC_LICENSE_ACCEPTED to be
    // set to "yes".
    // This package would normally be installed automatically by rosdep, but
    // there is no way to pass RTI_NC_LICENSE_ACCEPTED through rosdep.
    await runAptGetInstall(["rti-connext-dds-5.3.1"]);

    // Install all Python 3 dependencies.
    await exec.exec(
    "sudo",
    ["pip3", "install", "--upgrade", "argcomplete", "colcon-common-extensions",
     "colcon-mixin", "flake8", "flake8-blind-except", "flake8-builtins",
     "flake8-class-newline", "flake8-comprehensions", "flake8-deprecated",
     "flake8-docstrings", "flake8-import-order", "flake8-quotes", "pytest",
     "pytest-cov", "pytest-repeat", "pytest-rerunfailures", "pytest-runner",
     "setuptools", "wheel"]);

    // Initializes rosdep
    await exec.exec("sudo", ["rosdep", "init"])
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

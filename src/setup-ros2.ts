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

async function runBrew(packages: string[]): Promise<number> {
   return exec.exec(
        "brew", ["install"].concat(packages)
    )
}

async function installPython3Dependencies(): Promise<number> {
   return exec.exec(
    "sudo",
    ["pip3", "install", "--upgrade",
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
}

async function runLinux() {
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
  ["build-essential", "clang", "cmake", "git", "lcov",
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

  await installPython3Dependencies();

  // Initializes rosdep
  await exec.exec("sudo", ["rosdep", "init"])
}

async function runOsX() {
  await runBrew([
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
  await exec.exec(
    "sudo", [
      "bash",
      "-c",
      "echo \"export OPENSSL_ROOT_DIR=$(brew --prefix openssl)\" >> ~/.bashrc"
  ]);
  await exec.exec(
    "sudo", [
      "bash",
      "-c",
      "echo \"export CMAKE_PREFIX_PATH=$CMAKE_PREFIX_PATH:/usr/local/opt/qt\" >> ~/.bashrc"
  ]);
  await exec.exec(
    "sudo", [
      "bash",
      "-c",
      "echo \"export PATH=$PATH:/usr/local/opt/qt/bin\" >> ~/.bashrc"
  ]);
  await installPython3Dependencies();

  // While rosdep and vcs are available as a Debian package on Ubuntu, they need
  // to be installed through pip on OS X.
  await exec.exec(
   "sudo", ["pip3", "install", "--upgrade", "rosdep", "vcstool"])
  // Initializes rosdep
  await exec.exec("sudo", ["rosdep", "init"])
}

async function runWindows() {
  core.setFailed("Windows is not yet supported");
}

async function run() {
  try {
    const platform = process.platform;
    if (platform === "darwin") {
      await runOsX();
    } else if (platform === "win32") {
      await runWindows();
    } else if (platform === "linux") {
      await runLinux();
    } else {
      core.setFailed(`unsupport platform ${platform}`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

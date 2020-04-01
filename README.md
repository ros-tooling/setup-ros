# `setup-ros`

[![GitHub Action
Status](https://github.com/ros-tooling/setup-ros/workflows/Test%20setup-ros/badge.svg)](https://github.com/ros-tooling/setup-ros)
[![Greenkeeper
badge](https://badges.greenkeeper.io/ros-tooling/setup-ros.svg)](https://greenkeeper.io/)
![GitHub](https://img.shields.io/github/license/ros-tooling/setup-ros)

This action sets up a [ROS] and ROS 2 environment for use in actions, so
that:

* [ROS 2 latest development branch][ros2_latest_development_setup] builds from
  source,
* non-EOL (End Of Life) distribution of ROS 2 builds from source,
* any ROS, and ROS 2 package depending on non-EOL distribution builds from
  source

## Supported platforms

This GitHub action aims for strict [REP-3] and [REP-2000] compliance.
This action supports all non-EOL ROS distributions, on all Tier-1
platforms.
In particular, this action supports macOS, and Microsoft Windows.

For macOS, and Microsoft Windows, the OS version specified in the REPs may
not be available as a [GitHub Hosted runners][github_hosted_runners].
In this case, this GitHub action CI runs the closest available worker
environment.

Users requiring exact REP compliance should run the action on a [self-hosted
runner][self_hosted_runner].

This problem does not apply to Linux workers, where Docker can
ensure that the action runs the Linux distribution specified by the REPs.

## Modifications performed by the action

The action installs the following command-line tools:

 * `colcon`
 * `rosdep`
 * `vcs`

It also performs the following actions:

* On Linux:
  * Setting the locale to `en_US.UTF-8` and, the timezone to UTC
  * GCC and clang default APT packages
  * Registering the Open Robotics APT repository
  * Installing ROS, and ROS 2 system dependencies using APT
* On macOS:
  * Installing ROS, and ROS 2 system dependencies using [Homebrew] and [pip]
* On Microsoft Windows:
  * Installing ROS, and ROS 2 system dependencies using [Chocolatey]

The dependencies installed by this package include ROS 2 DDS vendor packages,
such as FastRTPS, OpenSplice, and RTI Connext.
See `src/package_manager/*.ts` for the complete list.

## Usage

See [action.yml](action.yml).

This action is under active developement, and compatibility between releases
is not yet guaranteed.
Please do not use `ros-tooling/setup-ros@master`.
Instead, pin your workflows to a particular release:
`ros-tooling/setup-ros@0.0.16`.

### Setting up the worker, and installing the system dependencies

```yaml
steps:
- uses: ros-tooling/setup-ros@0.0.16
- run: vcs --help
```

### Setting up the worker, and installing system dependencies on all OSes

```yaml
jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
          os: [macOS-latest, ubuntu-18.04, windows-latest]
    steps:
      - name: Setup ROS
        uses: ros-tooling/setup-ros@0.0.16
      - run: vcs --help
```

### Setting up the worker, installing system dependencies, and ROS (Linux)

See [action.yml](action.yml):

```yaml
steps:
- uses: ros-tooling/setup-ros@0.0.16
  with:
    required-ros-distributions: melodic dashing
- run: "source /opt/ros/dashing/setup.bash && ros run --help"
```

## Alternative to `setup-ros`

On Linux workers, an alternative to `setup-ros` is to run actions on a
Docker container where ROS is pre-installed.
See [Open Robotics DockerHub page][dockerhub_osrf], for instance.

## License

The scripts and documentation in this project are released under the [Apache
2](LICENSE)

[Chocolatey]: https://chocolatey.org/
[Homebrew]: https://brew.sh/
[REP-2000]: https://www.ros.org/reps/rep-2000.html
[REP-3]: https://www.ros.org/reps/rep-0003.html
[ROS]: https://www.ros.org/
[dockerhub_osrf]: https://hub.docker.com/r/osrf/ros/
[github_hosted_runners]: https://help.github.com/en/actions/automating-your-workflow-with-github-actions/software-installed-on-github-hosted-runners
[pip]: https://pip.pypa.io/en/stable/
[ros2_latest_development_setup]: https://index.ros.org/doc/ros2/Installation/Latest-Development-Setup/
[self_hosted_runner]: https://help.github.com/en/actions/automating-your-workflow-with-github-actions/about-self-hosted-runners

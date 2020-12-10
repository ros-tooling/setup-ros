# `setup-ros`

[![GitHub Action
Status](https://github.com/ros-tooling/setup-ros/workflows/Test%20setup-ros/badge.svg)](https://github.com/ros-tooling/setup-ros)
[![codecov](https://codecov.io/gh/ros-tooling/setup-ros/branch/master/graph/badge.svg)](https://codecov.io/gh/ros-tooling/setup-ros)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=ros-tooling/setup-ros)](https://dependabot.com)
![GitHub](https://img.shields.io/github/license/ros-tooling/setup-ros)

This action sets up a [ROS] and ROS 2 environment for use in actions, so
that:

- [ROS 2 latest development branch][ros2_latest_development_setup] builds from
  source,
- non-EOL (End Of Life) distribution of ROS 2 builds from source,
- any ROS, and ROS 2 package depending on non-EOL distribution builds from
  source

The action will not install ROS, or ROS 2, by default. To install a ROS binary distribution, pass a value to `required-ros-distributions` (see example below).

:warning: `apt-get update` is flaky on bare metal GitHub actions Linux workers relying on the GitHub APT mirrors.
It is recommended to run `setup-ros` in a Docker container.
See [`jobs.<job_id>.container` documentation](https://help.github.com/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idcontainer).
An alternative approach is to edit APT sources on the bare metal worker (see [#80](https://github.com/ros-tooling/setup-ros/issues/80) for details).

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

- `colcon`
- `rosdep`
- `vcs`

It also performs the following actions:

- On Linux:
  - Setting the locale to `en_US.UTF-8` and, the timezone to UTC
  - GCC and clang default APT packages
  - Registering the Open Robotics APT repository
  - Installing ROS, and ROS 2 system dependencies using APT
- On macOS:
  - Installing ROS, and ROS 2 system dependencies using [Homebrew] and [pip]
- On Microsoft Windows:
  - Installing ROS, and ROS 2 system dependencies using [Chocolatey]

The dependencies installed by this package include ROS 2 DDS vendor packages,
such as FastRTPS, OpenSplice, and RTI Connext.
See `src/package_manager/*.ts` for the complete list.

## Usage

See [action.yml](action.yml).

This action is under active development, and compatibility between releases
is not yet guaranteed.
Please do not use `ros-tooling/setup-ros@master`.
Instead, pin your workflows to a particular release:
`ros-tooling/setup-ros@0.0.25`.

### Setting up the worker, and installing the system dependencies

The default behavior is to only install development tools.
No ROS binary distribution is installed in this case.
This setup should be used when ROS is built entirely from source.

```yaml
steps:
  - uses: ros-tooling/setup-ros@0.0.25
  - run: vcs --help
```

### Setting up the worker, and installing system dependencies on all OSes

It is possible to iterate on OS X, and Windows from the same job (`build`).
Ubuntu requires its own separate workflow as additional configuration is
required for Docker.

```yaml
jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [macOS-latest, windows-latest]
    steps:
      - name: Setup ROS
        uses: ros-tooling/setup-ros@0.0.25
      - run: vcs --help

  build_docker:
    runs-on: ubuntu-latest
    container:
      image: ubuntu:bionic
    steps:
      - name: Setup ROS
        uses: ros-tooling/setup-ros@0.0.25
      - run: vcs --help
```

### Setting up the worker, installing system dependencies, and ROS (Linux)

One or more ROS distributions can be installed simultaneously
by passing multiple values to `required-ros-distributions`.
This setup is necessary to use the ROS1/ROS2 bridge:
[ros1_bridge](https://github.com/ros2/ros1_bridge).

```yaml
build_docker:
  runs-on: ubuntu-latest
  container:
    image: ubuntu:bionic
  steps:
    - uses: ros-tooling/setup-ros@0.0.25
      with:
        required-ros-distributions: melodic dashing
    - run: "source /opt/ros/dashing/setup.bash && ros2 run --help"
    - run: "source /opt/ros/melodic/setup.bash && rosnode --help"
```

### Use Pre-release ROS2 source for Testing

You can specify if you'd like to use the [pre-release ROS2 source url](https://index.ros.org/doc/ros2/Installation/Prerelease-Testing/) in your sources list file by setting the `use-ros2-testing` parameter to true

```yaml
build_docker:
  runs-on: ubuntu-latest
  container:
    image: ubuntu:bionic
  steps:
    - uses: ros-tooling/setup-ros@0.0.25
      with:
        use-ros2-testing: true
        required-ros-distributions: dashing
```

### Including RTI Connext

By default this action will not install RTI Connext as it requires acceptance of a non-commerical license, which should be reviewed by users on their own before accepting the license agreement. To include RTI Connext, simply set the `install-connext` parameter to `true`.

```yaml
build_docker:
  runs-on: ubuntu-latest
  container:
    image: ubuntu:bionic
  steps:
    - uses: ros-tooling/setup-ros@0.0.25
      with:
        install-connext: true
        use-ros2-testing: true
        required-ros-distributions: dashing
```

### Iterating on all ROS distributions, for all platforms

This workflow illustrates how to spawn one job per ROS release, for
every supported platform.

The workflow `test` is iterating on all ROS 2 distributions, on OS X, and Windows.

The workflow `test_docker` is iterating on all ROS, and ROS 2 distributions, for all
supported Ubuntu distributions, using Docker.
The test matrix associates each distribution with one Docker image.
This is required to ensure that the appropriate Ubuntu container is used.
For instance, Kinetic requires `xenial`, but all other distributions require `bionic`.

```yaml
jobs:
  test: # Docker is not supported on OS X, and Windows.
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macOS-latest, windows-latest]
        ros_distribution: # Only include ROS 2 distributions, as ROS 1 does not support OS X, and Windows.
          - dashing
          - eloquent
          - foxy
    steps:
      - uses: ros-tooling/setup-ros@0.0.25
        with:
          required-ros-distributions: ${{ matrix.ros_distribution }}
      - name: build and test
        uses: ros-tooling/action-ros-ci@0.1.0
        with:
          package-name: YOUR_PACKAGE_HERE MORE_PACKAGES_HERE
          target-ros2-distro: ${{ matrix.ros_distribution }}
          vcs-repo-file-url: ""

  test_docker: # On Linux, iterates on all ROS 1, and ROS 2 distributions.
    runs-on: ubuntu-latest
    strategy:
      matrix:
        ros_distribution:
          - kinetic
          - melodic
          - noetic
          - dashing
          - eloquent
          - foxy

        # Define the Docker image(s) associated with each ROS distribution.
        # The include syntax allows additional variables to be defined, like
        # docker_image in this case. See documentation:
        # https://help.github.com/en/actions/reference/workflow-syntax-for-github-actions#example-including-configurations-in-a-matrix-build
        #
        # Platforms are defined in REP 3, and REP 2000:
        # https://ros.org/reps/rep-0003.html
        # https://ros.org/reps/rep-2000.html
        include:
          # Kinetic Kame (May 2016 - May 2021)
          - docker_image: ubuntu:xenial
            ros_distribution: kinetic
            # Setting ros_version is helpful to customize the workflow
            # depending on whether a ROS 1, or ROS 2 is being tested.
            # See 'if: ros_version ==' below for an example.
            ros_version: 1

          # Melodic Morenia (May 2018 - May 2023)
          - docker_image: ubuntu:bionic
            ros_distribution: melodic
            ros_version: 1

          # Noetic Ninjemys (May 2020 - May 2025)
          - docker_image: ubuntu:focal
            ros_distribution: noetic
            ros_version: 1

          # Dashing Diademata (May 2019 - May 2021)
          - docker_image: ubuntu:bionic
            ros_distribution: dashing
            ros_version: 2

          # Eloquent Elusor (November 2019 - November 2020)
          - docker_image: ubuntu:bionic
            ros_distribution: eloquent
            ros_version: 2
            
          # Foxy Fitzroy (June 2020 - May 2023)
          - docker_image: ubuntu:focal
            ros_distribution: foxy
            ros_version: 2

    container:
      image: ${{ matrix.docker_image }}
    steps:
      - name: setup ROS environment
        uses: ros-tooling/setup-ros@0.0.25
        with:
          required-ros-distributions: ${{ matrix.ros_distribution }}
      - name: build and test ROS1
        if: ${{ matrix.ros_version == 1 }}
        uses: ros-tooling/action-ros-ci@0.1.0
        with:
          package-name: YOUR_PACKAGE_HERE MORE_PACKAGES_HERE
          target-ros1-distro: ${{ matrix.ros_distribution }}
          vcs-repo-file-url: ""
      - name: build and test ROS2
        if: ${{ matrix.ros_version == 2 }}
        uses: ros-tooling/action-ros-ci@0.1.0
        with:
          package-name: YOUR_PACKAGE_HERE MORE_PACKAGES_HERE
          target-ros2-distro: ${{ matrix.ros_distribution }}
          vcs-repo-file-url: ""
```

## Alternative to `setup-ros`

On Linux workers, an alternative to `setup-ros` is to run actions on a
Docker container where ROS is pre-installed.
See [Open Robotics DockerHub page][dockerhub_osrf], for instance.

## License

The scripts and documentation in this project are released under the [Apache
2](LICENSE)

[chocolatey]: https://chocolatey.org/
[homebrew]: https://brew.sh/
[rep-2000]: https://www.ros.org/reps/rep-2000.html
[rep-3]: https://www.ros.org/reps/rep-0003.html
[ros]: https://www.ros.org/
[dockerhub_osrf]: https://hub.docker.com/r/osrf/ros/
[github_hosted_runners]: https://help.github.com/en/actions/automating-your-workflow-with-github-actions/software-installed-on-github-hosted-runners
[pip]: https://pip.pypa.io/en/stable/
[ros2_latest_development_setup]: https://index.ros.org/doc/ros2/Installation/Latest-Development-Setup/
[self_hosted_runner]: https://help.github.com/en/actions/automating-your-workflow-with-github-actions/about-self-hosted-runners

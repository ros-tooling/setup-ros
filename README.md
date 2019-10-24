# setup-ros2

[![GitHub Action Status](https://github.com/ros-tooling/setup-ros2/workflows/Test%20setup-ros2/badge.svg)](https://github.com/ros-tooling/setup-ros2) [![Greenkeeper badge](https://badges.greenkeeper.io/ros-tooling/setup-ros2.svg)](https://greenkeeper.io/)

This action sets up a [ROS 2](https://index.ros.org/doc/ros2/) environment:

* Set locale to en_US.UTF-8
* Set timezone to UTC
* Register OSRF APT GPG key
* Add OSRF APT repository
* Install required development tools and ROS tools:
 * FastRTPS
 * RTI Connext
 * colcon
 * rosdep
 * vcs

This action does not install or compile ROS 2 itself.

## Usage

See [action.yml](action.yml)

```yaml
steps:
- uses: ros-tooling/setup-ros2@master
- run: vcs --help
```

## License

The scripts and documentation in this project are released under the [Apache 2](LICENSE)

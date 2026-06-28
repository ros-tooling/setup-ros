#!/usr/bin/env bash
#
# ./check-ros-distribution.sh <ROS distribution>
# ROS distribution must match the directory name for this distribution
# in /opt. E.g. melodic.

readonly ROS_DISTRIBUTION="$1"

# GitHub Action is erroneously setting PYTHONHOME to C:\python37
unset PYTHONHOME
source "/opt/ros/${ROS_DISTRIBUTION}/setup.bash"
rosstack list

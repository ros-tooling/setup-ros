#!/bin/sh
set -eux

apt-get update

# Select a locale supporting Unicode.
sudo locale-gen en_US en_US.UTF-8
sudo update-locale LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8
export LANG=en_US.UTF-8

# Enforce UTC time for consistency.
echo 'Etc/UTC' > /etc/timezone
ln -sf /usr/share/zoneinfo/Etc/UTC /etc/localtime
apt-get install --no-install-recommends --quiet --yes tzdata

# OSRF APT repository is necessary, even when building
# from source to install colcon, vcs, etc.
apt-get install --no-install-recommends --quiet --yes curl gnupg2 lsb-release
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C1CF6E31E6BADE8868B172B4F42ED6FBAB17C654
echo "deb http://packages.ros.org/ros2/ubuntu $(lsb_release -sc) main" > \
  /etc/apt/sources.list.d/ros2-latest.list
apt-get update

# Install colcon, rosdep, and vcs.
# colcon and vcs dependencies (e.g. git), as well as
# base building packages are not pulled by rosdep, so
# they are also installed during this stage.
apt-get install --no-install-recommends --quiet --yes \
  build-essential \
  cmake \
  git \
  python3-colcon-common-extensions \
  python3-lark-parser \
  python3-pip \
  python3-rosdep \
  python3-vcstool \
  wget

# FastRTPS dependencies
apt-get install --no-install-recommends --quiet --yes \
  libasio-dev \
  libtinyxml2-dev

# Install OpenSplice
apt-get install --no-install-recommends --quiet --yes libopensplice69

# Install RTI Connext in a non-interactive way.
# Skipping the license agreement page requires RTI_NC_LICENSE_ACCEPTED to be
# set to "yes".
# This package would normally be installed automatically by rosdep, but
# there is no way to pass RTI_NC_LICENSE_ACCEPTED through rosdep.
DEBIAN_FRONTEND=noninteractive RTI_NC_LICENSE_ACCEPTED=yes \
  apt-get install --no-install-recommends --quiet --yes rti-connext-dds-5.3.1

# Install all Python 3 dependencies.
pip3 install --requirement requirements.txt --upgrade

# Initializes rosdep
rosdep init

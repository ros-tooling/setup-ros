#!/usr/bin/env bash
set -euxo pipefail

env
uname

ls /usr/bin

dpkg -S python3-rosdep


which colcon
which rosdep
which vcs

# On Windows, cppcheck cannot be installed through rosdep, so setup-ros
# should install it.
if [[ "${RUNNER_OS}" == Windows ]]; then
  which cppcheck
fi

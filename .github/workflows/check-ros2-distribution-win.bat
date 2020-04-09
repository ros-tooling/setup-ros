if not exist c:\\dev\\%ROSDISTRO%\\ros2-windows\\local_setup.bat exit 1
call c:\\dev\\%ROSDISTRO%\\ros2-windows\\local_setup.bat
ros2 pkg list

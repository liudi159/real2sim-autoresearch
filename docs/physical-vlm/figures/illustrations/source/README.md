# Franka model rendering

The robot illustrations use official visual meshes from [Franka Robotics / franka_description](https://github.com/frankarobotics/franka_description), commit `7aeeddc449edf8d62b594f9e36a81da53e7796f9`.

- Robot: FER / Panda; stock two-finger Franka Hand.
- Geometry: `meshes/robots/fer/visual/link0.dae` through `link7.dae`, `hand.dae`, `finger.dae`.
- Kinematics: `robots/fer/kinematics.yaml`; hand mounting yaw −π/4; finger origin z = 0.0584 m; opposing finger transforms as defined in `end_effectors/common/franka_hand.xacro`.
- Pose: `[0, −π/4, 0, −3π/4, 0, π/2, π/4]`; finger displacement 0.025 m each.
- The 53 × 50 × 61 mm box and neutral stage are illustrative geometry. These images do not demonstrate a tested grasp, calibrated mass measurement, or completed robotic experiment.
- Source geometry and nominal colors are retained; lighting and camera views are chosen for illustration. No extra force/torque sensor is depicted. A real measurement must use a calibrated force estimate or an external sensing arrangement.
- Copyright 2023 Franka Robotics GmbH. Apache License 2.0. See `FRANKA-LICENSE` and `FRANKA-NOTICE`.

Reproduce with `render_franka.py SOURCE_REPOSITORY OUTPUT_DIRECTORY`. Dependencies used: Python, NumPy, PyYAML, trimesh, pycollada, pyrender 0.1.45, PyOpenGL 3.1.10, Pillow, and EGL. The script includes compatibility handling for NumPy 2's removal of `np.infty`. PyOpenGL 3.1.10 was used to support the Python 3.12 environment although pyrender 0.1.45 declares an older exact dependency.

The wood-chair, camera, sliding apparatus and indentation illustrations were produced with the built-in image generation tool. Exact prompts are in `../generation-prompts.json`. The generated gripper in the source sheet is superseded by the official mesh render in all final figures.

Website images are encoded as WebP at the original resolution (quality 90); this only changes the delivery format. The renderer produces PNG originals.

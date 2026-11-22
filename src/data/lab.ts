import type { LabEntry } from "./types";

/** Experiments and curiosity builds. Repo descriptions mirror the GitHub repositories. */
export const lab: LabEntry[] = [
  {
    id: "backpressure",
    name: "Backpressure Simulator",
    kind: "interactive",
    domains: ["distributed", "observability"],
    description:
      "A live, in-browser model of admission control — the same idea the Telemetry Collector uses. Push the offered load past capacity and compare rejecting at the door with buffering forever.",
    tags: ["queueing", "admission control", "runs locally"],
  },
  {
    id: "ray-tracer",
    name: "Ray Tracer",
    kind: "repo",
    language: "C++",
    domains: ["infrastructure"],
    description:
      "A C++ ray tracer that renders 3D scenes with spheres — ray-object intersection, surface normals, and viewport camera controls.",
    repo: "https://github.com/iratansh/Ray-Tracer",
    tags: ["graphics", "geometry"],
  },
  {
    id: "ur5e-ppo",
    name: "UR5e PPO Grasping",
    kind: "repo",
    language: "Python",
    domains: ["ai"],
    description: "A UR5e sim-to-real environment in MuJoCo with a PPO training script for object grasping.",
    repo: "https://github.com/iratansh/UR5e-PPO-Object-Grasping-MuJoCo",
    tags: ["reinforcement learning", "robotics", "MuJoCo"],
  },
  {
    id: "ur30-vlm",
    name: "UR30 Vision-Language Manipulation",
    kind: "repo",
    language: "Python",
    domains: ["ai", "infrastructure"],
    description:
      "Research platform from the University of Alberta for getting a UR30 arm to follow natural-language commands: speech input, vision-language detection, depth reasoning, and hybrid inverse kinematics on ROS 2 and Gazebo, in a Dockerized dev environment. The validated baseline is a simulated pick of a target object. The rest was handed off for continued research in January 2026.",
    repo: "https://github.com/iratansh/UR30-VLM-Object-Detection",
    tags: ["ROS 2", "Gazebo", "VLM", "research handoff"],
  },
  {
    id: "go2-ar",
    name: "Unitree Go2 Construction-Site AR",
    kind: "repo",
    language: "C# · Python",
    domains: ["ai"],
    description:
      "A Unity construction-site scene rendered in AR on a Meta Quest, paired with a Python gait controller that runs a 50 Hz control loop on the Unitree Go2's onboard computer through the Unitree SDK. Includes a PyBullet test bed for checking the controller against simulation and EmotiBit physiological-data processing.",
    repo: "https://github.com/iratansh/Unitree-Go2-Construction-Site-AR",
    tags: ["Unity", "Unitree SDK", "PyBullet", "AR"],
  },
  {
    id: "puddle-world",
    name: "Puddle World PPO",
    kind: "repo",
    language: "Python",
    domains: ["ai"],
    description: "Proximal Policy Optimization for the Puddle World Gym environment.",
    repo: "https://github.com/iratansh/Puddle-World-Reinforcement-Learning",
    tags: ["reinforcement learning", "Gym"],
  },
];

import * as core from "@actions/core";
import * as exec from "@actions/exec";

async function run() {
  try {
    await exec.exec("sudo", ["./setup-host.sh"]);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

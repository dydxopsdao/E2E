import { runner } from "./config/applitools.config";

module.exports = async () => {
  // Wait for all eyes tests from all workers
  const results = await runner.getAllTestResults();
  console.log("Applitools test results:", results);
};

import { runScheduledJobs } from "../lib/jobs";

runScheduledJobs()
  .then(() => {
    console.log("Jobs finished.");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

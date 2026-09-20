import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "clean-old-search-cache",
  { hourUTC: 3, minuteUTC: 0 },
  internal.discover.cleanOldSearchCache
);

crons.daily(
  "pause-inactive-monitors",
  { hourUTC: 4, minuteUTC: 0 },
  internal.monitors.autoPauseInactiveMonitors
);

export default crons;

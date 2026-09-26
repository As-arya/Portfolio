import type { NextConfig } from "next";
const config: NextConfig = {
  devIndicators: false,
  // Use worker threads so builds also run in environments that restrict child processes.
  experimental: { workerThreads: true, useTypeScriptCli: false },
};
export default config;

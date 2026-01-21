import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Ensures Next always treats this folder as the workspace root.
    root: path.join(__dirname),
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The registered ThreeUI sources are shipped as TypeScript and compiled here,
  // so the authored files stay byte-exact instead of being pre-built.
  transpilePackages: ["@designcodeio/threeui"],

  webpack(config) {
    // The authored sources reach for their TypeScript siblings with an explicit
    // `.js` specifier, which is what the published ESM output does.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
    };

    // Scene documents are pulled in as text with `?raw`.
    config.module.rules.push({
      test: /\.html$/i,
      resourceQuery: /raw/,
      type: "asset/source",
    });

    return config;
  },
};

export default nextConfig;

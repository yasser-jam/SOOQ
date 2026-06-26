/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: [
		"@workspace/ui",
		"@puckeditor/core",
		"@puckeditor/plugin-heading-analyzer",
		"@puckeditor/plugin-emotion-cache",
	],
	typescript: {
		// !! WARNING !!
		// Dangerously allow production builds to successfully complete even if
		// your project has TypeScript errors.
		ignoreBuildErrors: true,
	  },
};

export default nextConfig;

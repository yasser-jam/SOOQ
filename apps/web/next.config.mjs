/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: [
		"@workspace/ui",
		"@puckeditor/core",
		"@puckeditor/plugin-heading-analyzer",
		"@puckeditor/plugin-emotion-cache",
	],
};

export default nextConfig;

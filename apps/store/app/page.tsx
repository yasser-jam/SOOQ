import { StorefrontRenderer } from "@/components/storefront-renderer"
import { ThemeJsonTester } from "@/components/theme-json-tester"

export default function Home() {
	return (
		<>
			<ThemeJsonTester />
			<StorefrontRenderer />
		</>
	)
}

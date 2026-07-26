import { StorefrontRenderer } from "@/modules/storefront/components/storefront-renderer"
import { ThemeJsonTester } from "@/modules/storefront/components/theme-json-tester"

export default function PublishedStorePage() {
	return (
		<>
			<ThemeJsonTester />
			<StorefrontRenderer />
		</>
	)
}

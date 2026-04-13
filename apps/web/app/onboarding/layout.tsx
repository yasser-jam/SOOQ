import { OnboardingQueryProvider } from "@/components/onboarding/onboarding-query-provider"
import { Info, ShoppingCart, Star } from "lucide-react"

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OnboardingQueryProvider>
      <header>
        <div className="container flex items-center justify-between py-4 text-sm text-primary">
          <h1 className="text-3xl font-bold text-primary">SOOQ</h1>

          <div className="flex items-center gap-2">
            <Info size={16} />

            <div>تواصل معنا</div>
          </div>
        </div>
      </header>

      <div className="relative flex flex-col items-center justify-center">
        <div className="absolute bottom-4 left-1/4 -rotate-12">
          <ShoppingCart size={100} className="text-gray-400 opacity-50" />
        </div>

        <div className="absolute -top-4 right-1/4 rotate-12">
          <Star size={85} className="text-gray-400 opacity-50" />
        </div>

        {children}
      </div>
    </OnboardingQueryProvider>
  )
}

import { Info, ShoppingBag, ShoppingCart, Star } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <header>
        <div className="container flex justify-between items-center text-primary py-4 text-sm">
          <h1 className="text-3xl font-bold text-primary">SOOQ</h1>
        
          <div className="flex items-center gap-2">
            <Info size={16} />

            <div>تواصل معنا</div>
          </div>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center relative">
        <div className="absolute bottom-4 left-1/4 -rotate-12">
          <ShoppingCart size={100} className="text-gray-400 opacity-50" />
        </div>

        <div className="absolute -top-4 right-1/4 rotate-12">
          <Star size={85} className="text-gray-400 opacity-50" />
        </div>

        {children}
      </div>
    </>
  )
}

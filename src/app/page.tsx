import TopSection from "@/components/TopSection";
import PromotionsSection from "@/components/PromotionsSection";

export default function Home() {
  return (
    <main className="flex h-[100dvh] w-screen flex-col overflow-hidden flex-nowrap">
      <div className="flex-1 min-h-0 relative">
        <PromotionsSection />
      </div>
      <div className="flex-shrink-0 h-[22vh]">
        <TopSection />
      </div>
    </main>
  );
}

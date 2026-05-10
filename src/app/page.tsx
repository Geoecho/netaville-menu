import TopSection from "@/components/TopSection";
import PromotionsSection from "@/components/PromotionsSection";

export default function Home() {
  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden">
      <TopSection />
      <PromotionsSection />
    </main>
  );
}

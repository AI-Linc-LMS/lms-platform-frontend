import { ImpactEconomyProvider } from "@/lib/contexts/ImpactEconomyContext";

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <ImpactEconomyProvider>{children}</ImpactEconomyProvider>;
}

import IdentityConsole from "@/components/IdentityConsole";

export const metadata = {
  title: "Agent Identity - Arc Agentic Settlement Lab",
  description: "Prepare and verify ERC-8004 agent identity proofs on Arc Testnet.",
};

export default function IdentityPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white">Agent Identity</h1>
        <p className="text-sm text-gray-400 max-w-3xl">
          Phase 2 turns agent identity into a first-class proof before live ERC-8183 settlement.
          The current implementation prepares registration calldata and verifies existing ERC-8004
          identities through Arc Testnet contract reads.
        </p>
      </div>
      <IdentityConsole />
    </div>
  );
}

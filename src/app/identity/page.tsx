import IdentityConsole from "@/components/IdentityConsole";

export const metadata = {
  title: "Agent Identity - Arc Trade Agent Settlement",
  description: "Prepare and verify ERC-8004 agent identity proofs on Arc Testnet.",
};

export default function IdentityPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8 text-slate-950">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-950">Agent Identity</h1>
        <p className="text-sm text-slate-500 max-w-3xl">
          Agent identity turns an autonomous supplier or buyer into a verifiable commercial actor.
          This page prepares registration calldata and verifies existing ERC-8004 identities through
          Arc Testnet contract reads.
        </p>
      </div>
      <IdentityConsole />
    </div>
  );
}

import JobConsole from "@/components/JobConsole";

export const metadata = {
  title: "Escrow Deal Room - Arc Trade Agent Settlement",
  description:
    "Create proof-gated USDC escrow deals on Arc with delivery evidence, evaluator approval, and auditable receipts.",
};

export default function JobsPage() {
  return <JobConsole />;
}

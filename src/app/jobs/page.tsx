import JobConsole from "@/components/JobConsole";

export const metadata = {
  title: "Trade Settlement Console - Arc Trade Agent Settlement",
  description:
    "Create SME trade settlement jobs, verify ERC-8004 identity, prepare ERC-8183 wallet execution, and export receipts.",
};

export default function JobsPage() {
  return <JobConsole />;
}

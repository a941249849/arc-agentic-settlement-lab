import JobConsole from "@/components/JobConsole";

export const metadata = {
  title: "Service Payment Console - Arc Agentic Commerce Settlement",
  description:
    "Create buyer-agent service jobs, verify ERC-8004 identity, prepare ERC-8183 wallet execution, and export settlement receipts.",
};

export default function JobsPage() {
  return <JobConsole />;
}

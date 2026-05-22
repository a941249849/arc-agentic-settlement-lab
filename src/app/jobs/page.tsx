import JobConsole from "@/components/JobConsole";

export const metadata = {
  title: "Job Console – Arc Agentic Settlement Lab",
  description:
    "Verify ERC-8004 agent identity and manage Arc agentic settlement jobs through the ERC-8183 lifecycle scaffold.",
};

export default function JobsPage() {
  return <JobConsole />;
}

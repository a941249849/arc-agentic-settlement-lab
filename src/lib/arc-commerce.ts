import {
  createPublicClient,
  decodeEventLog,
  encodeFunctionData,
  formatUnits,
  http,
  isHex,
  keccak256,
  parseUnits,
  toHex,
  type Hex,
} from "viem";
import { arcTestnet, ARC_TESTNET_EXPLORER, ARC_TESTNET_RPC } from "./arc-chain";

export const AGENTIC_COMMERCE_CONTRACT = "0x0747EEf0706327138c69792bF28Cd525089e4583";
export const ARC_USDC = "0x3600000000000000000000000000000000000000";
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const agenticCommerceAbi = [
  {
    type: "function",
    name: "createJob",
    stateMutability: "nonpayable",
    inputs: [
      { name: "provider", type: "address" },
      { name: "evaluator", type: "address" },
      { name: "expiredAt", type: "uint256" },
      { name: "description", type: "string" },
      { name: "hook", type: "address" },
    ],
    outputs: [{ name: "jobId", type: "uint256" }],
  },
  {
    type: "function",
    name: "setBudget",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "optParams", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "fund",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "optParams", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "submit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "deliverable", type: "bytes32" },
      { name: "optParams", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "complete",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "reason", type: "bytes32" },
      { name: "optParams", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getJob",
    stateMutability: "view",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "client", type: "address" },
          { name: "provider", type: "address" },
          { name: "evaluator", type: "address" },
          { name: "description", type: "string" },
          { name: "budget", type: "uint256" },
          { name: "expiredAt", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "hook", type: "address" },
        ],
      },
    ],
  },
  {
    type: "event",
    name: "JobCreated",
    inputs: [
      { indexed: true, name: "jobId", type: "uint256" },
      { indexed: true, name: "client", type: "address" },
      { indexed: true, name: "provider", type: "address" },
      { indexed: false, name: "evaluator", type: "address" },
      { indexed: false, name: "expiredAt", type: "uint256" },
      { indexed: false, name: "hook", type: "address" },
    ],
    anonymous: false,
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export const ERC8183_STATUS_NAMES = [
  "Open",
  "Funded",
  "Submitted",
  "Completed",
  "Rejected",
  "Expired",
];

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(ARC_TESTNET_RPC),
});

export type ArcCommerceAction =
  | "createJob"
  | "setBudget"
  | "approve"
  | "fund"
  | "submit"
  | "complete";

export function toBytes32(value: string): Hex {
  const trimmed = value.trim();
  if (isHex(trimmed) && trimmed.length === 66) return trimmed;
  return keccak256(toHex(trimmed));
}

export function prepareCommerceTx(input: {
  action: ArcCommerceAction;
  providerAddress?: string;
  evaluatorAddress?: string;
  description?: string;
  expiredAt?: string;
  onchainJobId?: string;
  amount?: string;
  deliverableHash?: string;
  reason?: string;
}) {
  const budget = parseUnits(input.amount || "0", 6);

  if (input.action === "createJob") {
    if (!input.providerAddress || !input.evaluatorAddress || !input.description) {
      throw new Error("providerAddress, evaluatorAddress, and description are required");
    }
    const expiredAt = BigInt(
      input.expiredAt || Math.floor(Date.now() / 1000 + 7 * 24 * 60 * 60).toString()
    );
    return {
      to: AGENTIC_COMMERCE_CONTRACT,
      data: encodeFunctionData({
        abi: agenticCommerceAbi,
        functionName: "createJob",
        args: [
          input.providerAddress as Hex,
          input.evaluatorAddress as Hex,
          expiredAt,
          input.description,
          ZERO_ADDRESS,
        ],
      }),
    };
  }

  if (!input.onchainJobId) {
    throw new Error("onchainJobId is required");
  }
  const jobId = BigInt(input.onchainJobId);

  if (input.action === "setBudget") {
    if (!input.amount) throw new Error("amount is required");
    return {
      to: AGENTIC_COMMERCE_CONTRACT,
      data: encodeFunctionData({
        abi: agenticCommerceAbi,
        functionName: "setBudget",
        args: [jobId, budget, "0x"],
      }),
    };
  }

  if (input.action === "approve") {
    if (!input.amount) throw new Error("amount is required");
    return {
      to: ARC_USDC,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [AGENTIC_COMMERCE_CONTRACT, budget],
      }),
    };
  }

  if (input.action === "fund") {
    return {
      to: AGENTIC_COMMERCE_CONTRACT,
      data: encodeFunctionData({
        abi: agenticCommerceAbi,
        functionName: "fund",
        args: [jobId, "0x"],
      }),
    };
  }

  if (input.action === "submit") {
    if (!input.deliverableHash) throw new Error("deliverableHash is required");
    return {
      to: AGENTIC_COMMERCE_CONTRACT,
      data: encodeFunctionData({
        abi: agenticCommerceAbi,
        functionName: "submit",
        args: [jobId, toBytes32(input.deliverableHash), "0x"],
      }),
    };
  }

  return {
    to: AGENTIC_COMMERCE_CONTRACT,
    data: encodeFunctionData({
      abi: agenticCommerceAbi,
      functionName: "complete",
      args: [jobId, toBytes32(input.reason || "deliverable-approved"), "0x"],
    }),
  };
}

export async function getCommerceJob(jobId: string) {
  if (!/^\d+$/.test(jobId)) throw new Error("jobId must be a positive integer string");
  const job = await publicClient.readContract({
    address: AGENTIC_COMMERCE_CONTRACT,
    abi: agenticCommerceAbi,
    functionName: "getJob",
    args: [BigInt(jobId)],
  });

  return {
    id: job.id.toString(),
    client: job.client,
    provider: job.provider,
    evaluator: job.evaluator,
    description: job.description,
    budget: formatUnits(job.budget, 6),
    expiredAt: job.expiredAt.toString(),
    status: Number(job.status),
    statusName: ERC8183_STATUS_NAMES[Number(job.status)] ?? "Unknown",
    hook: job.hook,
  };
}

export async function inspectCommerceTx(hash: Hex) {
  const receipt = await publicClient.getTransactionReceipt({ hash });
  let jobId: string | undefined;

  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: agenticCommerceAbi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "JobCreated") {
        jobId = decoded.args.jobId.toString();
      }
    } catch {
      continue;
    }
  }

  return {
    status: receipt.status,
    blockNumber: receipt.blockNumber.toString(),
    transactionHash: receipt.transactionHash,
    explorerUrl: `${ARC_TESTNET_EXPLORER}/tx/${receipt.transactionHash}`,
    jobId,
  };
}

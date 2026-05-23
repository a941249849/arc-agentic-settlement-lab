import {
  createPublicClient,
  encodeFunctionData,
  getAddress,
  http,
  isAddress,
  pad,
  toHex,
} from "viem";
import { arcTestnet, ARC_TESTNET_EXPLORER, ARC_TESTNET_RPC } from "./arc-chain";
import type { ArcAgentIdentity } from "./types";

export const IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
export const REPUTATION_REGISTRY = "0x8004B663056A597Dffe9eCcC1965A193B7388713";
export const VALIDATION_REGISTRY = "0x8004Cb1BF31DAf7788923b405b754f57acEB4272";

export const identityRegistryAbi = [
  {
    name: "register",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "metadataURI", type: "string" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "tokenURI",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(ARC_TESTNET_RPC),
});

export function prepareAgentRegistration(metadataURI: string) {
  const calldata = encodeFunctionData({
    abi: identityRegistryAbi,
    functionName: "register",
    args: [metadataURI],
  });

  return {
    chainId: arcTestnet.id,
    network: arcTestnet.name,
    contractAddress: IDENTITY_REGISTRY,
    abiFunctionSignature: "register(string)",
    args: [metadataURI],
    calldata,
    explorerUrl: `${ARC_TESTNET_EXPLORER}/address/${IDENTITY_REGISTRY}`,
  };
}

function parseUint256ToSigned(hex: string): number {
  const value = BigInt(hex.startsWith("0x") ? hex : `0x${hex}`);
  const maxUint256 = 1n << 256n;
  const halfUint256 = 1n << 255n;
  if (value >= halfUint256) {
    return Number(value - maxUint256);
  }
  return Number(value);
}

export async function verifyAgentIdentity(input: {
  agentId: string;
  expectedOwnerAddress?: string;
  expectedMetadataURI?: string;
  registerTxHash?: string;
}): Promise<{
  identity: ArcAgentIdentity;
  checks: {
    ownerMatches?: boolean;
    metadataMatches?: boolean;
  };
}> {
  if (!/^\d+$/.test(input.agentId)) {
    throw new Error("agentId must be a positive integer string");
  }

  if (input.expectedOwnerAddress && !isAddress(input.expectedOwnerAddress)) {
    throw new Error("expectedOwnerAddress must be a valid EVM address");
  }

  const tokenId = BigInt(input.agentId);
  const [ownerAddress, metadataURI] = await Promise.all([
    publicClient.readContract({
      address: IDENTITY_REGISTRY,
      abi: identityRegistryAbi,
      functionName: "ownerOf",
      args: [tokenId],
    }),
    publicClient.readContract({
      address: IDENTITY_REGISTRY,
      abi: identityRegistryAbi,
      functionName: "tokenURI",
      args: [tokenId],
    }),
  ]);

  const tokenIdHex = pad(toHex(tokenId), { size: 32 });
  const latestBlock = await publicClient.getBlockNumber();
  const blockRange = 10000n;
  const fromBlock = latestBlock - blockRange > 0n ? latestBlock - blockRange : 0n;

  // 1. Fetch reputation score and feedback count from logs
  let reputationScore: number | undefined;
  let feedbackCount = 0;
  try {
    const rawLogs = await publicClient.getLogs({
      address: REPUTATION_REGISTRY,
      fromBlock,
      toBlock: latestBlock,
    });
    const repLogs = rawLogs.filter(
      (log) =>
        log.topics[0] === "0x6a4a61743519c9d648a14e6493f47dbe3ff1aa29e7785c96c8326a205e58febc" &&
        log.topics[1]?.toLowerCase() === tokenIdHex.toLowerCase()
    );
    
    feedbackCount = repLogs.length;
    if (feedbackCount > 0) {
      let scoreSum = 0;
      for (const log of repLogs) {
        const scoreWord = log.data.slice(66, 130);
        const scoreVal = parseUint256ToSigned(scoreWord);
        scoreSum += scoreVal;
      }
      reputationScore = Math.round((scoreSum / feedbackCount) * 10) / 10;
    }
  } catch (err) {
    console.error("Failed to query reputation logs:", err);
  }

  // 2. Fetch validation status and validator from logs
  let validationStatus: "Validated" | "Unverified" | "Pending" | "Failed" = "Unverified";
  let validatorAddress: string | undefined;
  try {
    const rawLogs = await publicClient.getLogs({
      address: VALIDATION_REGISTRY,
      fromBlock,
      toBlock: latestBlock,
    });
    const valLogs = rawLogs.filter(
      (log) =>
        log.topics[0] === "0xafddf629e874ccc3963b6a888c477bd464a6c8525024fc88759ea3b2326349ae" &&
        log.topics[2]?.toLowerCase() === tokenIdHex.toLowerCase()
    );
    
    if (valLogs.length > 0) {
      const latestValLog = valLogs[valLogs.length - 1];
      const validatorHex = latestValLog.topics[1];
      if (validatorHex) {
        validatorAddress = getAddress("0x" + validatorHex.slice(-40));
      }
      
      const statusWord = latestValLog.data.slice(2, 66);
      const statusVal = Number(BigInt(`0x${statusWord}`));
      if (statusVal === 100 || statusVal > 0) {
        validationStatus = "Validated";
      } else {
        validationStatus = "Failed";
      }
    }
  } catch (err) {
    console.error("Failed to query validation logs:", err);
  }

  const checks = {
    ownerMatches: input.expectedOwnerAddress
      ? getAddress(ownerAddress) === getAddress(input.expectedOwnerAddress)
      : undefined,
    metadataMatches: input.expectedMetadataURI
      ? metadataURI === input.expectedMetadataURI
      : undefined,
  };

  return {
    identity: {
      standard: "ERC-8004",
      registryAddress: IDENTITY_REGISTRY,
      agentId: input.agentId,
      ownerAddress: getAddress(ownerAddress),
      metadataURI,
      registerTxHash: input.registerTxHash || undefined,
      isVerified: true,
      verifiedAt: new Date().toISOString(),
      reputationScore,
      feedbackCount,
      validationStatus,
      validatorAddress,
    },
    checks,
  };
}


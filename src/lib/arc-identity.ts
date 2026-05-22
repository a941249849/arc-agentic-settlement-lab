import {
  createPublicClient,
  encodeFunctionData,
  getAddress,
  http,
  isAddress,
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
    },
    checks,
  };
}


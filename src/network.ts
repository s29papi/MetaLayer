export type NetworkName = 'testnet' | 'mainnet' | string;

export interface NetworkConfig {
  name: NetworkName;
  rpcUrl: string;
  indexerUrl: string;
  explorerUrl?: string;
  chainId?: number;
  metaLayerAddress: `0x${string}`;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  testnet: {
    name: 'testnet',
    rpcUrl: 'https://evmrpc-testnet.0g.ai/',       // <- change if you have a different RPC
    indexerUrl: 'https://indexer-storage-testnet-turbo.0g.ai/', // <- change to the real indexer endpoint
    explorerUrl: 'https://chainscan-galileo.0g.ai/',
    chainId: 16602,
    metaLayerAddress: `0x${"3Ca8B5e3fCD85c9960C3F8c09f0cbe6145ccdC27"}`
  }
};
   
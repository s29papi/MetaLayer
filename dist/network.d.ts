export type NetworkName = 'testnet' | 'mainnet' | string;
export interface NetworkConfig {
    name: NetworkName;
    rpcUrl: string;
    indexerUrl: string;
    explorerUrl?: string;
    chainId?: number;
    metaLayerAddress: `0x${string}`;
}
export declare const NETWORKS: Record<string, NetworkConfig>;

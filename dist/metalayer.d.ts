import type { Indexer } from '@0glabs/0g-ts-sdk';
import { NetworkConfig } from './network';
import { OGFileCtx } from './consts';
import type { Wallet } from 'ethers';
export declare class MetaLayerClient {
    constructor();
    static encodeOGFileCtx(ctx: OGFileCtx): `0x${string}`;
    uploadWithCtx(indexer: Indexer, ctx: OGFileCtx, file: File, network: NetworkConfig, wallet: Wallet): Promise<{
        rootHash: string | null | undefined;
        txHash: {
            txHash: string;
            rootHash: string;
        };
        totalChunks: number;
        error?: undefined;
    } | {
        rootHash: string | null | undefined;
        totalChunks: number;
        txHash: null;
        error: string;
    } | undefined>;
    isOnchainAwareCtx(rootHash: string | null | undefined, network: NetworkConfig, wallet: Wallet): Promise<boolean>;
    getOnchainAwareCtx(rootHash: string | null | undefined, network: NetworkConfig, wallet: Wallet): Promise<`0x${string}` | null>;
    makeOnchainAwareCtx(rootHash: string | null | undefined, ctxEncoded: `0x${string}`, network: NetworkConfig, wallet: Wallet): Promise<void>;
    decodeOGFileCtx(encoded: `0x${string}`): {
        fileType: unknown;
        extension: unknown;
        dateAdded: unknown;
        encrypted: unknown;
        creator: unknown;
    };
}
export default MetaLayerClient;

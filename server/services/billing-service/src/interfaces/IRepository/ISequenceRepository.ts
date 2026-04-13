export interface ISequenceRepository {
    getNextNumber(tenantId: string, type: string): Promise<number>;
}

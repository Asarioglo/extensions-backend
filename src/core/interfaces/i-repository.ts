export type RepoCallback<T> = (err: any, data: T | null) => void;

export default interface IRepository<T> {
    findOrCreate(
        queryData: Partial<T>,
        callback?: RepoCallback<T>
    ): Promise<T | null>;

    findById(id: string, callback?: RepoCallback<T>): Promise<T | null>;

    findOne(
        queryData: Partial<T>,
        callback: RepoCallback<T>
    ): Promise<T | null>;

    update(
        queryData: Partial<T>,
        updateData: Partial<T>,
        callback?: RepoCallback<T>
    ): Promise<T | null>;
}

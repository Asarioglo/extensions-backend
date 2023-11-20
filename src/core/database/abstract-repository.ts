export type RepoCallback<T> = (err: any, data: T | null) => void;

export default abstract class AbstractRepository<T> {
    abstract findOrCreate(
        queryData: Partial<T>,
        callback?: RepoCallback<T>
    ): Promise<T>;

    abstract findById(id: string, callback?: RepoCallback<T>): Promise<T>;

    abstract findOne(
        queryData: Partial<T>,
        callback: RepoCallback<T>
    ): Promise<T>;

    abstract update(
        queryData: Partial<T>,
        updateData: Partial<T>,
        callback?: RepoCallback<T>
    ): Promise<T>;
}

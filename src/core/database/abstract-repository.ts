export type RepoCallback<T> = (err: any, data: T | null) => void;

export default abstract class AbstractRepository<T> {
    abstract findOrCreate(
        queryData: Partial<T>,
        callback?: RepoCallback<T>
    ): void | Promise<T>;

    abstract findById(
        id: string,
        callback?: RepoCallback<T>
    ): void | Promise<T>;

    abstract findOne(
        queryData: Partial<T>,
        callback: RepoCallback<T>
    ): void | Promise<T>;
}

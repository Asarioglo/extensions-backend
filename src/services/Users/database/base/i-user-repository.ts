import IRepository from "../../../../core/interfaces/i-repository";
import { IUser } from "../../models/i-user";

export type UserCallback = (err: Error | null, user: IUser | null) => void;

export default interface IUserRepository extends IRepository<IUser> {}

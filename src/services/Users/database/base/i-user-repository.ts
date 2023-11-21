import IRepository from "../../../../core/interfaces/i-repository";
import { IUser } from "../../models/i-user";

export type UserCallback = (err: any, user: IUser | null) => void;

export default interface IUserRepository extends IRepository<IUser> {}

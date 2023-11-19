import AbstractRepository from "../../../../core/database/abstract-repository";
import { IUser } from "../../models/i-user";

export type UserCallback = (err: any, user: IUser | null) => void;

export default abstract class AbstractUserRepo extends AbstractRepository<IUser> {}

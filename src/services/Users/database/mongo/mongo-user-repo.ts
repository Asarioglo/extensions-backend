import mongoose, { Document, Model } from "mongoose";
import AbstractUserRepo from "../base/abstract-user-repo";
import UserSchema from "./schemas/user-schema";
import { IUser } from "../../models/i-user";
import { ParamUtils } from "../../../../core/utils/param-utils";

type UserCallback = (err: any, user: IUser | null) => void;

export default class MongoUserRepo extends AbstractUserRepo {
    private connection: mongoose.Connection;
    private User: Model<IUser>;

    constructor(connection: mongoose.Connection) {
        super();
        this.connection = connection;
        this.User = this.connection.model("User", UserSchema);
    }

    _createAlias(userData: Partial<IUser>): string {
        return userData.email.substring(0, 2).toUpperCase();
    }

    async _findOrCreate(
        userData: Partial<IUser>,
        callback?: UserCallback
    ): Promise<IUser> {
        const required = [
            "providerId",
            "provider",
            "email",
            "token",
            "refreshToken",
            "name",
        ];
        ParamUtils.requireParams(userData, required);

        let user = await this.User.findOne({ providerId: userData.providerId });
        // check required params
        if (!user) {
            userData = {
                ...userData,
                lastActive: new Date().toISOString(),
                verified: true,
                alias: this._createAlias(userData),
            };
            user = await this.User.create(userData);
        }
        return user;
    }

    findOrCreate(
        userData: Partial<IUser>,
        callback?: UserCallback
    ): void | Promise<IUser> {
        if (callback) {
            this._findOrCreate(userData)
                .then((user: IUser) => {
                    callback(null, user);
                })
                .catch((err: any) => {
                    callback(err, null);
                });
        } else {
            return this._findOrCreate(userData);
        }
    }

    findById(id: string, callback?: UserCallback): void | Promise<IUser> {
        // Implement the logic to find a user by ID
    }

    findOne(
        queryData: Partial<IUser>,
        callback: UserCallback
    ): Promise<IUser> | void {
        if (callback) {
            this.User.findOne(queryData)
                .then((user: IUser | null) => {
                    callback(null, user);
                })
                .catch((err: any) => {
                    callback(err, null);
                });
        } else {
            return this.User.findOne(queryData);
        }
    }
}

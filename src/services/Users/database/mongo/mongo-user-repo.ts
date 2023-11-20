import mongoose, { Document, Model } from "mongoose";
import AbstractUserRepo from "../base/abstract-user-repo";
import UserSchema from "./schemas/user-schema";
import { IUser } from "../../models/i-user";
import { ParamUtils } from "../../../../core/utils/param-utils";

export type UserCallback = (err: any, user: IUser | null) => void;

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

    async findOrCreate(
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

        let user: any = null;

        try {
            ParamUtils.requireParams(userData, required);

            // TODO: Should this search by Email or ProviderId?
            user = await this.User.findOne({
                providerId: userData.providerId,
            });
        } catch (err) {
            if (callback) {
                callback(err, null);
                return;
            } else {
                throw err;
            }
        }

        // check required params
        if (!user) {
            userData = {
                ...userData,
                lastActive: new Date(),
                verified: true,
                alias: this._createAlias(userData),
            };
            try {
                user = await this.User.create(userData);
            } catch (err) {
                if (callback) {
                    callback(err, null);
                    return;
                } else {
                    throw err;
                }
            }
        }
        if (callback) {
            callback(null, user.toJSON() as IUser);
        }
        return user.toJSON() as IUser;
    }

    async findById(id: string, callback?: UserCallback): Promise<IUser> {
        // Implement the logic to find a user by ID
        try {
            const user = await this.User.findById(id);
            if (user) {
                const userData = user.toJSON() as IUser;
                if (callback) {
                    callback(null, userData);
                }
                return userData;
            } else {
                if (callback) {
                    callback(null, null);
                }
                return null;
            }
        } catch (err) {
            if (callback) {
                callback(err, null);
            } else {
                throw err;
            }
        }
    }

    async findOne(
        queryData: Partial<IUser>,
        callback?: UserCallback
    ): Promise<IUser> {
        try {
            const user = await this.User.findOne(queryData);
            if (user) {
                const userData = user.toJSON() as IUser;
                if (callback) {
                    callback(null, userData);
                }
                return userData;
            } else {
                if (callback) {
                    callback(null, null);
                }
                return null;
            }
        } catch (err) {
            if (callback) {
                callback(err, null);
            } else {
                throw err;
            }
        }
    }

    async update(
        queryData: Partial<IUser>,
        updateData: Partial<IUser>,
        callback?: UserCallback
    ): Promise<IUser> {
        try {
            ParamUtils.requireParams(queryData, ["providerId", "email"]);

            const user = await this.User.findOneAndUpdate(
                queryData,
                updateData,
                { new: true } // to return the updated document instead of the original
            );
            if (user) {
                const userData = user.toJSON() as IUser;
                if (callback) {
                    callback(null, userData);
                }
                return userData;
            }
        } catch (err) {
            if (callback) {
                callback(err, null);
            } else {
                throw err;
            }
        }
    }
}

import mongoose, { Model } from "mongoose";
import IUserRepository, { UserCallback } from "../base/i-user-repository";
import UserSchema from "./schemas/user-schema";
import { IUser } from "../../models/i-user";
import { ParamUtils } from "../../../../core/utils/param-utils";

export default class MongoUserRepo implements IUserRepository {
    private connection: mongoose.Connection;
    private User: Model<IUser>;

    constructor(connection: mongoose.Connection) {
        this.connection = connection;
        this.User = this.connection.model("User", UserSchema);
    }

    _createAlias(userData: Partial<IUser>): string | null {
        return userData.email?.substring(0, 2).toUpperCase() || null;
    }

    async findOrCreate(
        userData: Partial<IUser>,
        callback?: UserCallback
    ): Promise<IUser | null> {
        const required = [
            "providerId",
            "provider",
            "email",
            "token",
            "refreshToken",
            "name",
        ];

        let user: unknown;

        try {
            ParamUtils.requireParams(userData, required);

            // TODO: Should this search by Email or ProviderId?
            user = await this.User.findOne({
                providerId: userData.providerId,
            });
        } catch (err) {
            if (callback) {
                callback(err, null);
                return null;
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
                alias: this._createAlias(userData)!,
            };
            try {
                user = await this.User.create(userData);
            } catch (err) {
                if (callback) {
                    callback(err, null);
                    return null;
                } else {
                    throw err;
                }
            }
        }
        if (!user) {
            throw new Error("User was not created");
        }
        // TODO: Need to improve this type checking for mongo models
        if (callback) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            callback(null, (user as any).toJSON() as IUser);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (user as any).toJSON() as IUser;
    }

    async findById(id: string, callback?: UserCallback): Promise<IUser | null> {
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
                return null;
            } else {
                throw err;
            }
        }
    }

    async findOne(
        queryData: Partial<IUser>,
        callback?: UserCallback
    ): Promise<IUser | null> {
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
                return null;
            } else {
                throw err;
            }
        }
    }

    async update(
        queryData: Partial<IUser>,
        updateData: Partial<IUser>,
        callback?: UserCallback
    ): Promise<IUser | null> {
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
            } else {
                if (callback) {
                    callback(null, null);
                }
                return null;
            }
        } catch (err) {
            if (callback) {
                callback(err, null);
                return null;
            } else {
                throw err;
            }
        }
    }
}

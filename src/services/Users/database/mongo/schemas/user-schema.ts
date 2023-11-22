import mongoose from "mongoose";
import { IUser } from "../../../models/i-user";

//------------ User Schema ------------//
const UserSchema = new mongoose.Schema<IUser>(
    {
        // used to verify that only one user is logged in at a time
        jwtId: {
            type: String,
            default: null,
        },
        name: {
            type: String,
            default: null,
        },
        email: {
            type: String,
            default: null,
            unique: true,
        },
        provider: {
            type: String,
            default: null,
        },
        providerId: {
            type: String,
            default: null,
            unique: true,
        },
        token: {
            type: String,
            default: null,
        },
        refreshToken: {
            type: String,
            default: null,
        },
        verified: {
            type: Boolean,
            default: false,
        },
        alias: {
            type: String,
        },
        lastActive: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

UserSchema.virtual("id").get(function (this: IUser) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this._id as any).toHexString();
});

UserSchema.set("toJSON", {
    virtuals: true,
});

export default UserSchema;

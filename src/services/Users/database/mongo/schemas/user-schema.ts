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
        },
        provider: {
            type: String,
            default: null,
        },
        providerId: {
            type: String,
            default: null,
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

export default UserSchema;

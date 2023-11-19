import AbstractAuthProvider from "../abstract-auth-provider.js";
import { OAuth2Client } from "google-auth-library";
import TokenLogic from "../../tokens/tokenlogic.js";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import { google } from "googleapis";
import { logger } from "../logger.js";

export default class GoogleProvider extends AbstractAuthProvider {
    constructor() {
        super();
        this.clientID = process.env.GOOGLE_CLIENT_ID;
        this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        this.callbackURL = process.env.GOOGLE_CALLBACK;
        this.name = "google";
    }

    static getName() {
        return "google";
    }

    addPassportStrategy(passport) {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: process.env.GOOGLE_CALLBACK,
                    passReqToCallback: true,
                },
                async function (req, accessToken, refreshToken, profile, done) {
                    if (req.session.root_user) {
                        if (profile.id === req.session.root_user.providerId) {
                            logger.info("Adding root user as a sub user", {
                                uuid: req.uuid,
                            });
                            const tmpUser = req.session.root_user;
                            req.session.root_user = null;
                            delete req.session.root_user;
                            return done(null, tmpUser);
                        }
                        try {
                            let sender = await Sender.findOrCreate(
                                req.session.root_user._id,
                                profile.id,
                                "google",
                                profile.emails[0].value,
                                accessToken,
                                refreshToken,
                                profile.displayName
                            );
                            if (!sender) {
                                logger.error(
                                    "Couldn't create sender. Object returned form findOrCreate is undefined",
                                    {
                                        uuid: req.uuid,
                                    }
                                );
                                return done(
                                    new Error("Couldn't create sender")
                                );
                            }
                            req.session.root_user = null;
                            delete req.session.root_user;

                            done(null, sender);
                        } catch (err) {
                            logger.error("Error creating sender: ", {
                                meta: {
                                    errorObject: err,
                                },
                                uuid: req.uuid,
                            });
                            req.session.root_user = null;
                            delete req.session.root_user;
                            return done(err);
                        }
                    } else {
                        try {
                            const user = await User.findOrCreate(
                                profile.id,
                                "google",
                                profile.emails[0].value,
                                accessToken,
                                refreshToken,
                                profile.displayName
                            );
                            if (!user) {
                                logger.error(
                                    "Couldn't create user. Object returned form findOrCreate is undefined",
                                    { uuid: req.uuid }
                                );
                                throw new Error("Couldn't create user");
                            }
                            done(null, user);
                        } catch (err) {
                            logger.error("Error creating user: ", {
                                meta: {
                                    errorObject: err,
                                },
                                uuid: req.uuid,
                            });
                            return done(err);
                        }
                    }
                }
            )
        );
    }

    addLoginRoutes(router) {
        router.get(
            "/google",
            passport.authenticate("google", {
                scope: [
                    "profile",
                    "email",
                    "openid",
                    "https://www.googleapis.com/auth/gmail.send",
                ],
                accessType: "offline",
                prompt: "consent",
            })
        );

        router.get(
            "/sub/google",
            TokenLogic.authenticateWithCode,
            passport.authenticate("google", {
                scope: [
                    "profile",
                    "email",
                    "openid",
                    "https://www.googleapis.com/auth/gmail.send",
                ],
                accessType: "offline",
                prompt: "consent",
                state: "sub_user",
            })
        );

        router.get(
            "/google/callback",
            passport.authenticate("google", { failureRedirect: "/login" }),
            GoogleProvider._handleLogin
        );
    }

    static async _handleLogin(req, res) {
        const { token, id } = TokenLogic.createTokenForUser(req.user);
        const { state } = req.query;

        if (state === "sub_user") {
            res.render("auth/sub_success", {
                userId: req.user._id,
                email: req.user.email,
            });
        } else {
            // Save jti to database (add your own logic to save jti)
            try {
                await User.findByIdAndUpdate(req.user.id, { jwtId: id });
                res.render("auth/success", {
                    auth_token: token,
                });
            } catch (err) {
                logger.error("Error saving jti", {
                    meta: {
                        errorObject: err,
                    },
                    uuid: req.uuid,
                });
                return res.status(500).json({ message: "Error saving jti." });
            }
        }
    }

    async sendEmail(user, recipientEmail, variables) {
        const { senderConfig } = user;
        if (!senderConfig) {
            logger.error("Sender config not found", {
                meta: {
                    userId: user.id,
                },
            });
            throw new Error("Sender config not found");
        }
        logger.debug(`Sender config retrieved form user ${user.email}`);
        const { emailTemplate, subjectTemplate } = senderConfig;

        // replace variables in the templates
        const emailBody = emailTemplate.replace(/{([^{}]*)}/g, (a, b) => {
            const r = variables[b];
            return typeof r === "string" || typeof r === "number" ? r : "";
        });
        logger.debug(`Subject template generated for user ${user.email}`);

        const emailSubject = subjectTemplate.replace(/{([^{}]*)}/g, (a, b) => {
            const r = variables[b];
            return typeof r === "string" || typeof r === "number" ? r : "";
        });
        logger.debug(`Email template generated for user ${user.email}`);

        // email options
        const mailOptions = {
            from: user.email,
            to: recipientEmail,
            subject: emailSubject,
            generateTextFromHTML: true,
            html: emailBody,
        };

        // create a JWT to authorize the gmail API
        const client = new OAuth2Client(
            this.clientID,
            this.clientSecret,
            this.callbackURL
        );
        logger.debug(`Created OAuth2Client for user ${user.email}`);

        client.setCredentials({ access_token: user.token });

        const gmail = google.gmail({ version: "v1", auth: client });
        logger.debug(`Created gmail object for user ${user.email}`);

        const raw = new Buffer.from(
            `From: ${mailOptions.from}\r\n` +
                `To: ${mailOptions.to}\r\n` +
                `Subject: ${mailOptions.subject}\r\n` +
                `Content-Type: text/html; charset=UTF-8\r\n` +
                `\r\n` +
                `${mailOptions.html}`
        )
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");

        logger.debug(`Created raw email for user ${user.email}`);

        const result = await gmail.users.messages.send({
            userId: "me",
            requestBody: {
                raw: raw,
            },
        });
        logger.debug(`Email sent for user ${user.email}`);

        return result;
    }

    async refreshToken(refreshToken) {
        const client = new OAuth2Client(
            this.clientID,
            this.clientSecret,
            this.callbackURL
        );

        const { tokens } = await client.refreshToken(refreshToken);

        return tokens.access_token;
    }
}

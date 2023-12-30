/**
 * @jest-environment ./src/core/testing/test-env-with-config.ts
 */
import { DoneCallback, Profile } from "passport";
import { getMainUserAuthCallback } from "../main-auth-cb";
import { ILogger } from "../../../../../../core/logging/i-logger";
import { getMockUserRepo } from "../../../../testing/mock-user-repo";
import { getMockExpress } from "../../../../../../core/testing/get-mock-express";

describe("getMainUserAuthCallback", () => {
    let logger = {} as ILogger;

    beforeAll(() => {
        logger = globalThis.__logger as ILogger;
    });

    it("should fail without emails in profile", async () => {
        const mockUserRepo = getMockUserRepo();
        const mockExpress = getMockExpress();
        const profile = {} as Profile;
        const callback = getMainUserAuthCallback(logger, mockUserRepo);
        expect(callback).toBeTruthy();
        const done = jest.fn() as DoneCallback;
        await callback(
            mockExpress.Request,
            "accessToken",
            "refreshToken",
            profile,
            done
        );
        expect(done).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should fail if userRepo.findOrCreate returns undefined", async () => {
        const mockUserRepo = getMockUserRepo();
        mockUserRepo.findOrCreate = jest.fn().mockResolvedValue(undefined);
        const mockExpress = getMockExpress();
        const profile = {
            emails: [{ value: "some@test.com" }],
        } as Profile;
        const callback = getMainUserAuthCallback(logger, mockUserRepo);
        expect(callback).toBeTruthy();
        const done = jest.fn() as DoneCallback;
        await callback(
            mockExpress.Request,
            "accessToken",
            "refreshToken",
            profile,
            done
        );
        expect(done).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call done with user", async () => {
        const mockUserRepo = getMockUserRepo(true);
        const mockExpress = getMockExpress();
        const profile = {
            emails: [{ value: "some@test.com" }],
        } as Profile;
        const callback = getMainUserAuthCallback(logger, mockUserRepo);
        expect(callback).toBeTruthy();
        const done = jest.fn() as DoneCallback;
        await callback(
            mockExpress.Request,
            "accessToken",
            "refreshToken",
            profile,
            done
        );
        expect(done).toHaveBeenCalledWith(
            null,
            await mockUserRepo.findOrCreate.mock.results[0].value
        );
    });
});

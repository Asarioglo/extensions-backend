import IIDProvider from "../../models/i-id-provider";
import { NextFunction, Response } from "express";

export class MockIDProvider implements IIDProvider {
    public name: string;

    constructor(name: string) {
        this.name = name;
    }

    initialize = jest.fn();

    refreshToken = jest.fn(async () => {
        return "test_token";
    });
}

export const getMockNext = () => {
    return jest.fn() as NextFunction;
};

export const getMockProvider = (
    name: string,
    refreshOutcome: "fail" | "success" | "no_token" = "fail"
) => {
    class MockProvider implements IIDProvider {
        name: string = name;
        initialize = jest.fn();
        refreshToken = jest.fn(async (): Promise<string> => {
            switch (refreshOutcome) {
                case "fail":
                    throw new Error("test_error");
                case "success":
                    return "test_token";
                case "no_token":
                    return "";
            }
        });
    }

    return new MockProvider();
};

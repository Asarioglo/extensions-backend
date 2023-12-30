import { RequestWithUUID } from "../interfaces/request-with-uuid";
import { Response } from "express";

export const getMockExpress = () => {
    class MockResponse {
        json = jest.fn(() => {
            return this;
        });
        send = jest.fn(() => {
            return this;
        });
        render = jest.fn(() => {
            return this;
        });
        status = jest.fn(() => {
            return this;
        });
        setHeader = jest.fn(() => {
            return this;
        });
    }
    class MockRequest {
        uuid = "test_uuid";
        headers = {};
    }
    return {
        Response: new MockResponse() as unknown as Response,
        Request: new MockRequest() as RequestWithUUID,
    };
};

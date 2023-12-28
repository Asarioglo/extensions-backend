import { Request } from "express";

export type RequestWithUUID = Request & { uuid: string };

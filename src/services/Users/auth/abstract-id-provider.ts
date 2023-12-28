import passport from "passport";
import { Router } from "express";

export default abstract class AbstractIDProvider {
    public name: string;

    constructor(name: string) {
        this.name = name;
    }

    abstract initialize(): void;

    abstract refreshToken(refreshToken: string): Promise<string>;

    getName(): string {
        return this.name;
    }
}

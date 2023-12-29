import { IMicroservice } from "../interfaces/i-microservice";
import { Router } from "express";

export class MockMicroservice implements IMicroservice {
    launch_called = false;
    uuid_received = false;

    public async launch(): Promise<Router> {
        const router = Router();

        router.get("/", (req, res) => {
            res.send("success");
        });

        router.get("/test_uuid", (req, res) => {
            if ("uuid" in req) {
                res.send("success");
            } else {
                res.status(400).send("failure");
            }
        });

        router.get("/get_success_json", (req, res) => {
            res.json({
                msg: "success",
            });
        });

        router.get("/get_success_text", (req, res) => {
            res.status(200).send("success");
        });

        router.get("/get_failure_500", (req, res) => {
            res.status(500).json({
                msg: "failure",
            });
        });

        router.get("/get_failure_401", (req, res) => {
            res.status(401).json({
                msg: "failure",
            });
        });

        router.post("/post_success_json", (req, res) => {
            res.json({
                msg: "success",
            });
        });

        router.post("/post_success_text", (req, res) => {
            res.status(200).send("success");
        });

        router.post("/post_failure_500", (req, res) => {
            res.status(500).json({
                msg: "failure",
            });
        });

        router.post("/post_failure_401", (req, res) => {
            res.status(401).json({
                msg: "failure",
            });
        });

        this.launch_called = true;

        return router;
    }
}

import { ConfigProvider } from "../config-provider";

describe("ConfigProvider", () => {
    let provider: ConfigProvider = new ConfigProvider();

    beforeEach(() => {
        provider = new ConfigProvider();
    });

    it("should return default value if key is not set", () => {
        expect(provider.get("foo", "bar")).toEqual("bar");
    });

    it("should correctly initialize from environmental variables", () => {
        process.env["FOO"] = "bar";
        process.env["BAZ"] = "qux";
        provider.from_mappings([
            ["FOO", "foo"],
            ["BAZ", "baz"],
            ["QUUX", "quux", "quux_default"],
            ["CORGE", "corge"],
        ]);

        expect(provider.get("foo")).toEqual("bar");
        expect(provider.get("baz")).toEqual("qux");
        expect(provider.get("quux")).toEqual("quux_default");
        expect(provider.get("corge")).toEqual(null);
    });

    it("should correctly set and get values", () => {
        provider.set("foo", "bar");
        expect(provider.get("foo")).toEqual("bar");
        expect(provider.get("foo", "baz")).toEqual("bar");
        expect(provider.get("baz", "qux")).toEqual("qux");
        expect(provider.get("baz")).toEqual(null);
    });

    it("Should clone the config provider", () => {
        provider.set("foo", "bar");
        const clone = provider.clone();
        expect(clone.get("foo")).toEqual("bar");
        clone.set("foo", "baz");
        expect(clone.get("foo")).toEqual("baz");
        expect(provider.get("foo")).toEqual("bar");
    });
});

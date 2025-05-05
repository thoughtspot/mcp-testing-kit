import server from "../src/index.js";
import { describe, it, expect, afterEach } from "vitest";
import { connect, close } from "../../../index.js";

describe("Basic MCP server", () => {
    afterEach(async () => {
        await close(server);
    });

    describe("Tools", () => {
        it("Should list the correct tools", async () => {
            const client = await connect(server);
            const tools = await client.listTools();
            expect(tools.tools.length).toEqual(1);
            expect(tools.tools[0].name).toEqual("start-notification-stream");
        });

        it("Should send the right number of notifications, when calling start-notification-stream", async () => {
            const client = await connect(server);
            let notificationCount = 0;
            client.onNotification((notification) => {
                notificationCount++;
            });
            await client.callTool("start-notification-stream", {
                interval: 10,
                count: 10,
            });
            expect(notificationCount).toEqual(10);
        });

        it("Should send non error success response after notification stream is ended", async () => {
            const client = await connect(server);
            const result = await client.callTool("start-notification-stream", {
                interval: 10,
                count: 5,
            });
            expect(result.isError).toBeUndefined();
            expect(result.content[0].type).toEqual("text");
        });
    });

    describe("Resources", () => {
        it("Should list the correct resources", async () => {
            const client = await connect(server);
            const resources = await client.listResources();
            expect(resources.resources.length).toEqual(1);
            expect(resources.resources[0].name).toEqual("greeting-resource");
        });
    });

    describe("Prompts", () => {
        it("Should list the correct prompts", async () => {
            const client = await connect(server);
            const prompts = await client.listPrompts();
            expect(prompts.prompts.length).toEqual(1);
            expect(prompts.prompts[0].name).toEqual("greeting-template");
        });

        it("Should return the correct prompt for the greeting-template prompt", async () => {
            const client = await connect(server);
            const prompt = await client.getPrompt("greeting-template", {
                name: "John",
            });
            expect(prompt.messages[0].role).toEqual("user");
            console.log(prompt.messages[0].content);
            expect(prompt.messages[0].content.type).toEqual("text");
            expect(prompt.messages[0].content.text).toEqual("Please greet John in a friendly manner.");
        });
    });
});
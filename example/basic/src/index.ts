import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetPromptResult, CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const server = new McpServer({
    name: 'simple-mcp-server',
    version: '1.0.0',
}, { capabilities: { logging: {} } });

// Register a simple prompt
server.prompt(
    'greeting-template',
    'A simple greeting prompt template',
    {
        name: z.string().describe('Name to include in greeting'),
    },
    async ({ name }): Promise<GetPromptResult> => {
        return {
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `Please greet ${name} in a friendly manner.`,
                    },
                },
            ],
        };
    }
);

// Register a tool specifically for testing resumability
server.tool(
    'start-notification-stream',
    'Starts sending periodic notifications for testing resumability',
    {
        interval: z.number().describe('Interval in milliseconds between notifications').default(100),
        count: z.number().describe('Number of notifications to send (0 for 100)').default(10),
    },
    async ({ interval, count }, { sendNotification }): Promise<CallToolResult> => {
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        let counter = 0;

        while (count === 0 || counter < count) {
            counter++;
            try {
                await sendNotification({
                    method: "notifications/message",
                    params: {
                        level: "info",
                        data: `Periodic notification #${counter} at ${new Date().toISOString()}`
                    }
                });
            }
            catch (error) {
                console.error("Error sending notification:", error);
            }
            // Wait for the specified interval
            await sleep(interval);
        }

        return {
            content: [
                {
                    type: 'text',
                    text: `Started sending periodic notifications every ${interval}ms`,
                }
            ],
        };
    }
);

// Create a simple resource at a fixed URI
server.resource(
    'greeting-resource',
    'https://example.com/greetings/default',
    { mimeType: 'text/plain' },
    async (): Promise<ReadResourceResult> => {
        return {
            contents: [
                {
                    uri: 'https://example.com/greetings/default',
                    text: 'Hello, world!',
                },
            ],
        };
    }
);

export default server;
# mcp-testing-kit </br> [![Coverage Status](https://coveralls.io/repos/github/thoughtspot/mcp-testing-kit/badge.svg?branch=main)](https://coveralls.io/github/thoughtspot/mcp-testing-kit?branch=main) ![NPM Version](https://img.shields.io/npm/v/mcp-testing-kit?link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2Fmcp-testing-kit)


The testing library you need to test your MCP servers.

## Overview

`mcp-testing-kit` provides utilities to test [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol) servers. It allows you to connect to an MCP server instance, send requests, receive notifications, and assert server behavior in your tests.

## Features

- Works with any testing framework (vitest, jest etc)
- Lightweight, provides "just enough" utils to test an MCP server.
- Typescript

## Installation

```bash
$ npm i -D mcp-testing-kit
```

## Example

Suppose you have an MCP server defined in `example/basic/src/index.ts`:

```ts
// mcp-server.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({ name: 'simple-mcp-server', version: '1.0.0' });

server.tool(
  'add',
  'Add two numbers MCP style',
  { 
    a: z.number().describe('first number'), 
    b: z.number().describe('second number') 
  },
  async ({ name }) => ({
    messages: [
      { role: 'user', content: { type: 'text', text: String(a + b) } }
    ]
  })
);

export default server;
```

You can write a test using `mcp-testing-kit` like this:

```ts
// mcp-server.test.js
import server from "../src/index.js";
// Use your favorite testing framework.
import { describe, it, expect, afterEach } from "vitest";
import { connect, close } from "../../../index.js";

describe("Basic MCP server", () => {
  afterEach(async () => {
    await close(server);
  });

  it("Should return correct sum when `sum` is called", async () => {
    // Connect to the server and create a mock client.
    const client = await connect(server);
    const result = await client.callTool("greeting-template", { a: 10, b: 2 });
    expect(result.content[0].text).toEqual("12");
  });
});
```

## API

### `connect(server: Server)`
Connects to an MCP server instance and returns a client with the following methods:

| Method | Signature | Description |
|--------|-----------|-------------|
| `listTools` | `(): Promise<ListToolsResult>` | List all tools registered on the server. |
| `callTool` | `(tool: string, params?: any): Promise<any>` | Call a tool by name with optional parameters. |
| `listResources` | `(): Promise<ListResourcesResult>` | List all resources registered on the server. |
| `listPrompts` | `(): Promise<ListPromptsResult>` | List all prompts registered on the server. |
| `getPrompt` | `(prompt: string, params?: any): Promise<any>` | Get a prompt by name with optional parameters. |
| `onNotification` | `(cb: (message: JSONRPCMessage) => void): void` | Register a callback for notifications from the server. |
| `onError` | `(cb: (message: JSONRPCMessage) => void): void` | Register a callback for error messages from the server. |
| `onProgress` | `(cb: (message: JSONRPCMessage) => void): void` | Register a callback for progress notifications from the server. |
| `sendToServer` | `(message: Request): Promise<any>` | Send a raw JSON-RPC request to the server. |

### `close(server: Server)`
Closes the MCP server instance.

## More Examples

See [`example/basic`](./example/basic) for a full-featured MCP server and corresponding tests.

## License

MIT

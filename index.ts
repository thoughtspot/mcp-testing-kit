import { consola } from "consola";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { isJSONRPCError, isJSONRPCNotification, JSONRPCMessage, JSONRPCNotification, JSONRPCResponse, ListToolsResult, JSONRPCError, ListResourcesResult, ProgressNotificationSchema, ListToolsRequestSchema, CallToolRequestSchema, ListResourcesRequestSchema, JSONRPCRequest, Request, ListPromptsRequestSchema, ListPromptsResult, isJSONRPCResponse, GetPromptRequestSchema } from "@modelcontextprotocol/sdk/types.js";

class TestTransport implements Transport {
    constructor(private recieverCb: (message: JSONRPCMessage) => void) { }

    async send(message: JSONRPCMessage) {
        this.recieverCb(message);
    }

    async start() {
        consola.debug("[TestTransport] Starting TEST transport");
    }

    async close() {
        consola.debug("[TestTransport] Closing TEST transport");
    }

    // MCP Server will override this methods
    onmessage(message: JSONRPCMessage) {
        consola.error("[TestTransport] Please connect to a server first!");
    }
}

type RPCResponse = JSONRPCResponse | JSONRPCError | JSONRPCNotification;

export function connect(server: Server) {
    let _recieverCbs: ((message: RPCResponse) => void)[] = [];
    const { resolve, reject, promise } = Promise.withResolvers<RPCResponse>();
    let recieverCb = (message: RPCResponse) => {
        _recieverCbs.forEach(cb => cb(message));
        if (isJSONRPCResponse(message)) {
            resolve(message);
        }
    }
    const transport = new TestTransport(recieverCb);
    server.connect(transport);
    let _requestId = 1;

    function sendToServer<T extends RPCResponse>(message: Request): Promise<T> {
        const requestId = _requestId++;
        const request: JSONRPCRequest = {
            jsonrpc: "2.0",
            id: requestId,
            ...message,
            params: {
                ...message.params,
                _meta: {
                    progressToken: requestId,
                },
            },
        };
        transport.onmessage?.(request);
        return promise as Promise<T>;
    }

    return {
        sendToServer: sendToServer,
        listTools: async () => {
            const message: JSONRPCResponse = await sendToServer({
                method: ListToolsRequestSchema.shape.method.value,
                params: {},
            });
            return message.result as ListToolsResult;
        },
        onNotification: (notificationCb: (message: JSONRPCMessage) => void) => {
            _recieverCbs.push((message: JSONRPCMessage) => {
                if (isJSONRPCNotification(message)) {
                    notificationCb(message);
                }
            });
        },
        onError: (errorCb: (message: JSONRPCMessage) => void) => {
            _recieverCbs.push((message: JSONRPCMessage) => {
                if (isJSONRPCError(message)) {
                    errorCb(message);
                }
            });
        },
        onProgress: (progressCb: (message: JSONRPCMessage) => void) => {
            _recieverCbs.push((message: JSONRPCMessage) => {
                if (isJSONRPCNotification(message)
                    && ProgressNotificationSchema.safeParse(message).success) {
                    progressCb(message);
                }
            });
        },
        callTool: async (tool: string, params: any = {}) => {
            const message = await sendToServer<JSONRPCResponse>({
                method: CallToolRequestSchema.shape.method.value,
                params: {
                    name: tool,
                    arguments: params,
                },
            });
            return message.result;
        },
        listResources: async () => {
            const message: JSONRPCResponse = await sendToServer({
                method: ListResourcesRequestSchema.shape.method.value,
            });
            return message.result as ListResourcesResult;
        },
        listPrompts: async () => {
            const message: JSONRPCResponse = await sendToServer({
                method: ListPromptsRequestSchema.shape.method.value,
            });
            return message.result as ListPromptsResult;
        },
        getPrompt: async (prompt: string, params: any = {}) => {
            const message = await sendToServer<JSONRPCResponse>({
                method: GetPromptRequestSchema.shape.method.value,
                params: {
                    name: prompt,
                    arguments: params,
                },
            });
            return message.result;
        }
    }
}

export function close(server: Server) {
    server.close();
}
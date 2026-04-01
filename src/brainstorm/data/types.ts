export interface ChatMessage {
    id: string;
    userId: string;
    text: string;
    timestamp: string;
    targetCardId?: string;
}

export interface MindMapNode {
    id: string;
    parentId: string | null;
    text: string;
    position: { x: number; y: number };
    depth: number;
}

export interface BrainstormMap {
    id: string;
    title: string;
    nodes: MindMapNode[];
    chatMessages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
}

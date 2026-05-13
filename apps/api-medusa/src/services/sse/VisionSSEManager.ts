type SSEResponse = any; // Will be express Response or MedusaResponse

class VisionSSEManager {
  private clients: Map<string, SSEResponse[]> = new Map();

  public broadcast(userId: string, payload: any) {
    if (userId && this.clients.has(userId)) {
      const userClients = this.clients.get(userId) || [];
      
      userClients.forEach((res) => {
        // Write SSE data
        res.write(`event: vision_update\n`);
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      });
    }
  }

  public addClient(userId: string, res: SSEResponse) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, []);
    }
    this.clients.get(userId)?.push(res);

    // Clean up when client disconnects
    res.on("close", () => {
      this.removeClient(userId, res);
    });
  }

  public removeClient(userId: string, res: SSEResponse) {
    if (this.clients.has(userId)) {
      const filtered = this.clients.get(userId)?.filter(c => c !== res) || [];
      if (filtered.length === 0) {
        this.clients.delete(userId);
      } else {
        this.clients.set(userId, filtered);
      }
    }
  }
}

export const visionSSEManager = new VisionSSEManager();

import amqplib, { Connection, Channel } from "amqplib";
import { IMessageQueueService } from "./IMessageQueueService";

export class AmqplibAdapter implements IMessageQueueService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private url: string;

  constructor() {
    this.url = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
  }

  async connect(): Promise<void> {
    if (this.connection && this.channel) {
      return;
    }
    try {
      this.connection = await amqplib.connect(this.url);
      this.channel = await this.connection.createChannel();
      console.log(`[AmqplibAdapter] Connected to RabbitMQ at ${this.url}`);
    } catch (error) {
      console.error("[AmqplibAdapter] Failed to connect to RabbitMQ:", error);
      throw error;
    }
  }

  async publish(queueName: string, payload: any): Promise<boolean> {
    try {
      await this.connect();
      if (!this.channel) {
        throw new Error("Channel is not established.");
      }
      
      // Ensure the queue exists
      await this.channel.assertQueue(queueName, { durable: true });
      
      const messageBuffer = Buffer.from(JSON.stringify(payload));
      const success = this.channel.sendToQueue(queueName, messageBuffer, {
        persistent: true,
      });
      
      console.log(`[AmqplibAdapter] Published message to queue '${queueName}'`);
      return success;
    } catch (error) {
      console.error(`[AmqplibAdapter] Error publishing to queue '${queueName}':`, error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log("[AmqplibAdapter] Disconnected from RabbitMQ");
    } catch (error) {
      console.error("[AmqplibAdapter] Error during disconnect:", error);
    }
  }
}

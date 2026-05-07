export interface IMessageQueueService {
  connect(): Promise<void>;
  publish(queueName: string, payload: any): Promise<boolean>;
  consume(queueName: string, callback: (payload: any) => Promise<void>): Promise<void>;
  disconnect(): Promise<void>;
}

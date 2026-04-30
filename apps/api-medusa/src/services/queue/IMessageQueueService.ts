export interface IMessageQueueService {
  connect(): Promise<void>;
  publish(queueName: string, payload: any): Promise<boolean>;
  disconnect(): Promise<void>;
}

import amqp from 'amqplib';
import { createLogger } from '../logger';

const logger = createLogger('RabbitMQService');

export class RabbitMQService {
    private connection: any = null;
    private channel: any = null;

    constructor(private rabbitMqUrl: string) {}

    async connect(): Promise<void> {
        let retries = 5;
        while (retries > 0) {
            try {
                this.connection = await amqp.connect(this.rabbitMqUrl);
                this.channel = await this.connection.createChannel();
                logger.info('Connected to RabbitMQ successfully.');

                this.connection.on('error', (err: any) => {
                    logger.error(`RabbitMQ connection error: ${err.message}`);
                    this.reconnect();
                });

                this.connection.on('close', () => {
                    logger.warn('RabbitMQ connection closed');
                    this.reconnect();
                });

                return;
            } catch (error: any) {
                retries -= 1;
                logger.error(`RabbitMQ connection failed. Retries left: ${retries}`, { error: error.message });
                if (retries === 0) throw error;
                await new Promise(res => setTimeout(res, 5000));
            }
        }
    }

    private async reconnect() {
        if (this.connection) {
            try {
                await this.connection.close();
            } catch (e) {}
        }
        await this.connect();
    }

    async publish(exchange: string, routingKey: string, message: any): Promise<boolean> {
        if (!this.channel) {
            logger.error('Cannot publish message. Channel is not initialized.');
            return false;
        }
        try {
            await this.channel.assertExchange(exchange, 'topic', { durable: true });
            const messageBuffer = Buffer.from(JSON.stringify(message));
            const result = this.channel.publish(exchange, routingKey, messageBuffer, { persistent: true });
            if (result) {
                logger.info(`Message published to exchange ${exchange} with routing key ${routingKey}`);
            }
            return result;
        } catch (error: any) {
            logger.error(`Failed to publish message: ${error.message}`);
            return false;
        }
    }

    async consume(exchange: string, queueName: string, routingKeys: string[], callback: (msg: any) => Promise<void>): Promise<void> {
        if (!this.channel) {
            logger.error('Cannot consume message. Channel is not initialized.');
            return;
        }
        try {
            await this.channel.assertExchange(exchange, 'topic', { durable: true });
            const q = await this.channel.assertQueue(queueName, { durable: true });

            for (const key of routingKeys) {
                await this.channel.bindQueue(q.queue, exchange, key);
            }

            await this.channel.prefetch(1);
            logger.info(`Waiting for messages in queue ${q.queue}`);

            await this.channel.consume(q.queue, async (msg: any) => {
                if (msg) {
                    try {
                        const content = JSON.parse(msg.content.toString());
                        await callback(content);
                        this.channel!.ack(msg);
                    } catch (error: any) {
                        logger.error(`Error processing message: ${error.message}`);
                        // Nack and requeue or send to DLQ based on logic
                        this.channel!.nack(msg, false, false); 
                    }
                }
            }, { noAck: false });
        } catch (error: any) {
            logger.error(`Failed to consume messages: ${error.message}`);
        }
    }

    async close(): Promise<void> {
        try {
            if (this.channel) await this.channel.close();
            if (this.connection) await this.connection.close();
            logger.info('RabbitMQ connection closed gracefully.');
        } catch (err: any) {
            logger.error(`Error while closing RabbitMQ connection: ${err.message}`);
        }
    }
}

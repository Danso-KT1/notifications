const amqp = require('amqplib');

const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URI || 'amqp://localhost'); // Use environment variable or default to localhost
        const channel = await connection.createChannel();
        return { connection, channel };
    } catch (error) {
        console.error('Error connecting to RabbitMQ:', error);
        throw error;
    }
};

module.exports = { connectRabbitMQ };

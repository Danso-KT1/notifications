const amqp = require('amqplib');

const connectRabbitMQ = async () => {
    try {
        // Connect to RabbitMQ using the URI from environment variables
        const connection = await amqp.connect(process.env.RABBITMQ_URI);
        
        // Log a message when connected
        console.log('Connected to RabbitMQ');

        // Optionally, you can set up a channel if needed
        const channel = await connection.createChannel();
        console.log('Channel created');

        return { connection, channel };
    } catch (error) {
        // Log any connection errors
        console.error('RabbitMQ connection error:', error);
    }
};

module.exports = connectRabbitMQ;
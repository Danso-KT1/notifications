const amqp = require('amqplib');

const QUEUE = 'notifications';

const createChannel = async () => {
    const connection = await amqp.connect(process.env.RABBITMQ_URI);
    return connection.createChannel();
};

exports.sendNotification = async (req, res) => {
    const { email, message } = req.body;
    if (!email || !message) {
        return res.status(400).json({ message: 'Email and message are required' });
    }

    const channel = await createChannel();
    await channel.assertQueue(QUEUE);
    channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify({ email, message })));

    res.status(201).json({ message: 'Notification queued' });
};
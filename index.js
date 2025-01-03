const express = require('express');
const mongoose = require('mongoose');
const notificationRoutes = require('./routes/notifications');
const { connectRabbitMQ } = require('./service/rabbitmq'); // Ensure this is the correct path
require('dotenv').config();
require('./service/mailer'); // Start the mailer service

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// RabbitMQ connection function
const startRabbitMQ = async () => {
    try {
        const { connection, channel } = await connectRabbitMQ(); // Connect to RabbitMQ
        console.log('RabbitMQ connected successfully');
        
        // Declare a queue (if needed)
        const queue = 'notifications'; // Example queue name
        await channel.assertQueue(queue, { durable: true });
        console.log(`Queue "${queue}" is ready`);
        
        // Optional: Example of consuming messages
        channel.consume(queue, (msg) => {
            if (msg !== null) {
                console.log(`Received message: ${msg.content.toString()}`);
                channel.ack(msg); // Acknowledge the message
            }
        });
    } catch (error) {
        console.error('Error connecting to RabbitMQ:', error);
    }
};

// Call the RabbitMQ connection function
startRabbitMQ().catch(err => console.error('Error starting RabbitMQ:', err));

// Use notification routes
app.use('/api/notifications', notificationRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

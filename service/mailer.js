const amqp = require('amqplib');
const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');

const QUEUE = 'notifications';

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: process.env.SMTP_PORT || 465, // 587 for STARTTLS or 465 for SSL
    secure: true, // true for port 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
    },
});

// Function to send email
const sendEmail = async (to, subject, text) => {
    const mailOptions = {
        from: process.env.SMTP_USER, // Sender's email address
        to,
        subject,
        text,
    };

    return transporter.sendMail(mailOptions);
};

// Start the mailer service
const startMailer = async () => {
    try {
        // Connect to RabbitMQ
        const connection = await amqp.connect(process.env.RABBITMQ_URI);
        const channel = await connection.createChannel();

        await channel.assertQueue(QUEUE);
        console.log('Waiting for messages in %s', QUEUE);

        // Consume messages from the queue
        channel.consume(QUEUE, async (msg) => {
            const { email, message } = JSON.parse(msg.content.toString());

            try {
                // Send email and save notification
                await sendEmail(email, 'New Notification', message);
                await Notification.create({ email, message }); // Save notification to the database
                console.log(`Email sent to ${email}`);
                channel.ack(msg); // Acknowledge the message
            } catch (error) {
                console.error('Error sending email:', error);

                // Retry logic
                if (msg.fields.deliveryTag < 5) { // Retry up to 5 times
                    setTimeout(() => channel.nack(msg, false, true), 5000); // Retry after 5 seconds
                } else {
                    console.error(`Failed to send email after multiple attempts: ${email}`);
                    channel.ack(msg); // Acknowledge to prevent endless retries
                }
            }
        });

        // Handle connection errors
        connection.on('error', (err) => {
            console.error('RabbitMQ connection error:', err);
        });

        connection.on('close', () => {
            console.error('RabbitMQ connection closed. Retrying...');
            setTimeout(startMailer, 5000); // Reconnect after 5 seconds
        });
    } catch (error) {
        console.error('Error starting mailer service:', error);
        setTimeout(startMailer, 5000); // Retry after 5 seconds
    }
};

startMailer().catch(console.error);

import { kafka } from "../kafka/index.js";

const producer = kafka.producer();

let isConnected = false;

const isProduction = process.env.LOGGER_ENV === "production";

export const connectProducer = async () => {
  if (!isProduction) return;

  if (!isConnected) {
    await producer.connect();
    isConnected = true;
    console.log("Kafka Producer connected");
  }
};

export const sendLog = async ({
  type = "info",
  message,
  source = "unknown-service"
}) => {
  try {
    // Skip logging if not production
    if (!isProduction) {
      console.log(`[${type}] ${source}: ${message}`);
      return;
    }

    if (!isConnected) {
      await connectProducer();
    }

    const logPayload = {
      type,
      message,
      source,
      timeStamp: new Date().toISOString()
    };

    await producer.send({
      topic: "logs",
      messages: [{ value: JSON.stringify(logPayload) }]
    });

  } catch (err) {
    console.error("Error sending log to Kafka:", err.message);
  }
};
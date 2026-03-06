import { Kafka } from "kafkajs";
import { KafkaError } from "../errorHandlers/index.js";

if (!process.env.KAFKA_API_KEY || !process.env.KAFKA_API_SECRET) {
  throw new KafkaError("Kafka credentials are missing in environment variables");
}

export const kafka = new Kafka({
    clientId: "kafka-service",
    brokers: ["pkc-l7pr2.ap-south-1.aws.confluent.cloud:9092"],
    ssl: true,
    sasl: {
        mechanism: "plain",
        username: process.env.KAFKA_API_KEY,
        password: process.env.KAFKA_API_SECRET
    },
    connectionTimeOut: 3000,
    authenticationTimeOut: 3000,
    retry: {
        initialRetryTime: 300,
        retries: 8
    }
});
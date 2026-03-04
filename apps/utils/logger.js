const { kafka } = require("../kafka/index");

const producer = kafka.producer();

let isConnected  = false;

exports.connectProducer = async () => {
    if(!isConnected){
        await producer.connect();
        isConnected = true;
        console.log("Kafka Producer connected");
    }
};

expports.sendLog = async({
    type = "info",
    message,
    source = "unknow-service"
}) => {
    try{
      if(!isConnected){
        await connectProducer();
      }
      const logPayload = {
        type,
        message,
        source,
        timeStamp: new Date().toISOString()
      }

      await producer.send({
        topic: "logs",
        messages: [{ value: JSON.stringify(logPayload)}]
      });

    }catch(err){
        console.error("Error sending log to Kafka:", err.message);
    }
};
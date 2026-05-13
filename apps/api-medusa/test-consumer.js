const amqplib = require('amqplib');
(async () => {
  const conn = await amqplib.connect('amqp://guest:guest@127.0.0.1:5672');
  const ch = await conn.createChannel();
  await ch.assertQueue('ai_vision_results', { durable: true });
  ch.consume('ai_vision_results', (msg) => {
    console.log("CONSUMED:", msg.content.toString());
    ch.ack(msg);
  });
  console.log("Listening...");
})();

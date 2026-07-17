const { PubSub } = require('@google-cloud/pubsub');
const User = require('../models/User'); // 🧠 Make sure this path correctly points to your User model
const messageController = require('../controllers/messageController'); // 🧠 Make sure this path points to your message controller

const pubSubClient = new PubSub();
const subscriptionName = process.env.GCP_SUBSCRIPTION_NAME;

function startGmailPullListener() {
  if (!subscriptionName) {
    console.warn("[Gmail Worker] GCP_SUBSCRIPTION_NAME is missing. Pull listener skipped.");
    return;
  }

  console.log(`[Gmail Worker] Listening to pull subscription: ${subscriptionName}...`);
  const subscription = pubSubClient.subscription(subscriptionName);

  const messageHandler = async (message) => {
    try {
      console.log(`[Gmail Worker] Event retrieved (Msg ID: ${message.id})`);

      // Decode the Base64 payload data sent by Google
      const rawData = Buffer.from(message.data, 'base64').toString('utf-8');
      const parsedPayload = JSON.parse(rawData);

      // Force lowercase to avoid any string matching issues
      const emailAddress = (parsedPayload.emailAddress || '').toLowerCase();
      const historyId = parsedPayload.historyId;

      console.log(`[Gmail Worker] Update detected for ${emailAddress} (History ID: ${historyId})`);

      if (emailAddress && historyId) {
        // 1. Look up the user document where googleEmail matches
        const tenant = await User.findOne({ googleEmail: emailAddress });
        
        if (!tenant) {
          console.warn(`[Gmail Worker] ❌ DB Mismatch: No user has the googleEmail "${emailAddress}"`);
          message.ack();
          return;
        }

        console.log(`[Gmail Worker] ✅ User found: ${tenant._id}. Running sync engine...`);

        // 2. RUN THE ACTUAL SYNC PIPELINE (Uncommented and operational)
        await messageController.syncGmailHistory(tenant, historyId);
        
        console.log(`[Gmail Worker] ✅ Sync engine execution finished successfully.`);
      }

      // Acknowledge receipt of the message so Pub/Sub removes it from the queue
      message.ack();
    } catch (err) {
      console.error("[Gmail Worker] Failed to process message stream:", err.message);
    }
  };

  subscription.on('message', messageHandler);

  subscription.on('error', (error) => {
    console.error('[Gmail Worker] Error in pull stream:', error);
  });
}

module.exports = { startGmailPullListener };
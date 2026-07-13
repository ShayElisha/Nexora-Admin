import Message from "../models/messageModel.js";
import { EmailService } from "./email.service.js";

/**
 * Send scheduled messages that are due
 */
const sendScheduledMessages = async () => {
  try {
    const now = new Date();
    
    // Find messages that are scheduled and due
    const scheduledMessages = await Message.find({
      status: "scheduled",
      scheduledFor: { $lte: now },
    });

    console.log(`Checking scheduled messages: ${scheduledMessages.length} found`);

    for (const message of scheduledMessages) {
      try {
        console.log(`Sending scheduled message: ${message._id} (scheduled for: ${message.scheduledFor})`);
        
        // Send to all recipients
        for (const recipient of message.recipients) {
          // Skip recipients without email
          if (!recipient.companyEmail) {
            console.warn(`Skipping recipient ${recipient.companyId} - no email address`);
            recipient.status = "failed";
            recipient.error = "No email address";
            continue;
          }
          
          try {
            await EmailService.sendCustomEmail(
              recipient.companyEmail,
              message.subject,
              message.content
            );

            recipient.status = "sent";
            recipient.sentAt = new Date();
            console.log(`Email sent successfully to ${recipient.companyEmail} (${recipient.companyName})`);
          } catch (error) {
            console.error(`Failed to send to ${recipient.companyEmail}:`, error);
            recipient.status = "failed";
            recipient.error = error.message;
          }
        }

        // Update message status
        const allSent = message.recipients.every((r) => r.status === "sent");
        const someSent = message.recipients.some((r) => r.status === "sent");
        
        if (allSent) {
          message.status = "sent";
        } else if (someSent) {
          message.status = "partial";
        } else {
          message.status = "failed";
        }
        
        message.sentAt = new Date();
        await message.save();
        
        console.log(`Scheduled message ${message._id} processed with status: ${message.status}`);
      } catch (error) {
        console.error(`Error processing scheduled message ${message._id}:`, error);
        // Mark as failed if there's an error
        message.status = "failed";
        if (!message.metadata) message.metadata = {};
        message.metadata.error = error.message;
        await message.save();
      }
    }
  } catch (error) {
    console.error("Error in sendScheduledMessages:", error);
  }
};

/**
 * Start the scheduler
 * Checks for scheduled messages every minute
 */
export const startScheduler = () => {
  console.log("Starting message scheduler...");
  
  // Run immediately on start
  sendScheduledMessages();
  
  // Then run every minute
  setInterval(() => {
    sendScheduledMessages();
  }, 60000); // 60 seconds = 1 minute
  
  console.log("Message scheduler started (checking every minute)");
};


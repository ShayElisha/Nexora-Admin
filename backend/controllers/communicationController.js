import Message from "../models/messageModel.js";
import MessageTemplate from "../models/messageTemplateModel.js";
import { EmailService } from "../services/email.service.js";
import axios from "axios";

const NEXORA_API_URL = process.env.NEXORA_API_URL || "http://localhost:5000/api";

// ============ Messages ============

export const sendMessage = async (req, res) => {
  try {
    const { subject, content, type, companyIds, scheduledFor } = req.body;
    const userId = req.user?.userId;

    if (!subject || !content || !companyIds || companyIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Subject, content, and at least one company are required",
      });
    }

    // Fetch companies from Nexora API to get real email addresses
    let recipients = [];
    
    try {
      // Fetch all companies from Nexora API
      const companiesResponse = await axios.get(`${NEXORA_API_URL}/companies`, {
        withCredentials: false,
      });
      
      const allCompanies = Array.isArray(companiesResponse.data?.data) 
        ? companiesResponse.data.data 
        : Array.isArray(companiesResponse.data) 
        ? companiesResponse.data 
        : [];
      
      // Map companyIds to actual company data
      for (const companyId of companyIds) {
        const company = allCompanies.find((c) => c._id === companyId || c.id === companyId);
        
        if (company) {
          recipients.push({
            companyId: company._id || company.id,
            companyName: company.name || "Unknown Company",
            companyEmail: company.email || company.contactEmail || null,
            status: scheduledFor ? "pending" : "pending",
          });
        } else {
          console.warn(`Company not found: ${companyId}`);
          // Still add it but mark as missing
          recipients.push({
            companyId,
            companyName: "Unknown Company",
            companyEmail: null,
            status: "failed",
          });
        }
      }
      
      // Filter out companies without email
      const validRecipients = recipients.filter((r) => r.companyEmail);
      if (validRecipients.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid company emails found. Please ensure companies have email addresses.",
        });
      }
      
      if (validRecipients.length < recipients.length) {
        console.warn(`Some companies (${recipients.length - validRecipients.length}) don't have email addresses`);
      }
      
      // Use valid recipients
      recipients = validRecipients;
    } catch (error) {
      console.error("Error fetching companies from Nexora API:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch company details",
        error: error.message,
      });
    }

    const message = await Message.create({
      subject,
      content,
      type: type || "email",
      status: scheduledFor ? "scheduled" : "draft",
      recipients,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      sentBy: userId,
    });

    // If not scheduled, send immediately
    if (!scheduledFor) {
      await sendMessageToRecipients(message);
    }

    res.json({
      success: true,
      message: scheduledFor ? "Message scheduled successfully" : "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

const sendMessageToRecipients = async (message) => {
  try {
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
        if (!message.metadata) message.metadata = {};
        message.metadata.error = error.message;
      }
    }

    message.status = message.recipients.every((r) => r.status === "sent")
      ? "sent"
      : "failed";
    message.sentAt = new Date();
    await message.save();
  } catch (error) {
    console.error("Error sending messages:", error);
    throw error;
  }
};

export const getMessages = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;

    const messages = await Message.find(query)
      .populate("sentBy", "name email")
      .populate("templateId", "name")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments(query);

    res.json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};

export const getMessageById = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate("sentBy", "name email")
      .populate("templateId", "name subject content");

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Get message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch message",
      error: error.message,
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
      error: error.message,
    });
  }
};

// ============ Templates ============

export const createTemplate = async (req, res) => {
  try {
    const { name, subject, content, type, variables, category } = req.body;
    const userId = req.user?.userId;

    if (!name || !subject || !content) {
      return res.status(400).json({
        success: false,
        message: "Name, subject, and content are required",
      });
    }

    const template = await MessageTemplate.create({
      name,
      subject,
      content,
      type: type || "email",
      variables: variables || [],
      category: category || "custom",
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      message: "Template created successfully",
      data: template,
    });
  } catch (error) {
    console.error("Create template error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create template",
      error: error.message,
    });
  }
};

export const getTemplates = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const query = {};

    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === "true";

    const templates = await MessageTemplate.find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error("Get templates error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch templates",
      error: error.message,
    });
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const template = await MessageTemplate.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Get template error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch template",
      error: error.message,
    });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const { name, subject, content, type, variables, category, isActive } =
      req.body;

    const template = await MessageTemplate.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(subject && { subject }),
        ...(content && { content }),
        ...(type && { type }),
        ...(variables && { variables }),
        ...(category && { category }),
        ...(isActive !== undefined && { isActive }),
      },
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    res.json({
      success: true,
      message: "Template updated successfully",
      data: template,
    });
  } catch (error) {
    console.error("Update template error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update template",
      error: error.message,
    });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const template = await MessageTemplate.findByIdAndDelete(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    res.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.error("Delete template error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete template",
      error: error.message,
    });
  }
};


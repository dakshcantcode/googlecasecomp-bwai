import { ChatGroq } from "@langchain/groq";

// Streaming instance — used for the chat endpoint
export const chatGroq = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY!,
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  streaming: true,
});

// Non-streaming instance — used for background profile updates
export const chatGroqSync = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY!,
  model: "llama-3.3-70b-versatile",
  temperature: 0.3,
  streaming: false,
});

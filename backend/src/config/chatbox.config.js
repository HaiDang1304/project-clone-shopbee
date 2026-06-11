const chatboxConfig = {
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqBaseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
  groqModel: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
  temperature: Number(process.env.CHATBOX_TEMPERATURE || 0.35),
  maxTokens: Number(process.env.CHATBOX_MAX_TOKENS || 700),
  productLimit: Number(process.env.CHATBOX_PRODUCT_LIMIT || 6),
}

module.exports = chatboxConfig

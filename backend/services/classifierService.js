'use strict';

const { extractJson } = require('./geminiService');

/**
 * Classifies an inbound email using Gemini.
 * Returns { category, priority, summary }.
 *
 * @param {string} emailText - The content of the email to classify.
 * @returns {Promise<{category: string, priority: string, summary: string}>}
 */
async function classifyEmail(emailText) {
  if (!emailText) {
    return {
      category: 'Inquiry',
      priority: 'medium',
      summary: 'No email content provided.'
    };
  }

  const prompt = `You are an AI email classifier for an Indian MSME. Your job is to analyze the incoming email and return a JSON object with:
- "category": Choose exactly one of ["Lead", "Inquiry", "Complaint", "Support"].
- "priority": Choose exactly one of ["high", "medium", "low"]. Use "high" only for urgent inquiries, complaints with strict deadlines, or critical payment issues.
- "summary": A very brief 1-sentence summary of the email's content (maximum 15 words).

Email text:
"${emailText}"`;

  const schema = `{
    "category": "Lead" | "Inquiry" | "Complaint" | "Support",
    "priority": "high" | "medium" | "low",
    "summary": "string"
  }`;

  try {
    const result = await extractJson(prompt, schema);
    if (result && result.category && result.priority && result.summary) {
      const validCategories = ['Lead', 'Inquiry', 'Complaint', 'Support'];
      const validPriorities = ['high', 'medium', 'low'];
      
      const category = validCategories.includes(result.category) ? result.category : 'Inquiry';
      const priority = validPriorities.includes(result.priority.toLowerCase()) ? result.priority.toLowerCase() : 'medium';
      
      return {
        category,
        priority,
        summary: result.summary
      };
    }
  } catch (err) {
    console.error('[ClassifierService] Email classification failed:', err.message);
  }

  // Fallback if classification fails or yields invalid format
  return {
    category: 'Inquiry',
    priority: 'medium',
    summary: emailText.length > 60 ? emailText.substring(0, 57) + '...' : emailText
  };
}

module.exports = { classifyEmail };

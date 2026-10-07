const axios = require('axios');

async function enrichScanResults(scanData) {
  const fallbackResponse = {
    executiveSummary: "The scan completed, but AI analysis is currently unavailable or timed out.",
    cspAnalysis: "Review your CSP manually to ensure unsafe-inline and unsafe-eval are avoided where possible.",
    remediation: []
  };

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn("OpenAI API Key not configured. Skipping AI enrichment.");
      return fallbackResponse;
    }

    const prompt = `
      You are an expert web security engineer. Analyze the following web security scan results:
      ${JSON.stringify(scanData, null, 2)}
      
      Return a JSON object strictly matching this schema:
      {
        "executiveSummary": "A 2-sentence plain-English risk summary for non-technical users.",
        "cspAnalysis": "Specific vulnerability/bypass analysis of the detected CSP.",
        "remediation": [
          { "header": "HeaderName", "framework": "Express/Nginx/Apache", "codeSnippet": "Code" }
        ]
      }
    `;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" }
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 8000
    });

    const aiContent = response.data.choices[0].message.content;
    return JSON.parse(aiContent);
  } catch (error) {
    console.error("AI Enrichment Error:", error.message);
    return fallbackResponse;
  }
}

module.exports = { enrichScanResults };

const fs = require('fs');
const axios = require('./node_modules/axios/index.d.cts');
require('dotenv').config();

class LLMExtractor {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('API key is required');
        }
        this.apiKey = apiKey;
    }

    async fetchLLMResponse(inputText) {
        try {
            const response = await axios.post(
                'https://api.x.ai/v1/chat/completions',
                {
                    model: 'grok-beta',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert at extracting structured JSON data from text.'
                        },
                        {
                            role: 'user',
                            content: inputText
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 4000
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.apiKey}`
                    }
                }
            );

            // Extract and clean up the raw response
            const rawContent = response.data.choices[0]?.message?.content || '';
            const cleanedContent = rawContent
                .replace(/^```json\s*/i, '') // Remove leading ```json
                .replace(/```$/, '');       // Remove trailing ```

            return cleanedContent;
        } catch (error) {
            console.error('Error fetching LLM response:', error.message);
            throw error;
        }
    }

    saveToMarkdown(content, outputFileName) {
        fs.writeFileSync(outputFileName, content);
        console.log(`Response saved to ${outputFileName}`);
    }
}

async function main() {
    if (process.argv.length < 4) {
        console.error('Usage: node save_response.js <input_file.txt> <output_file.md>');
        process.exit(1);
    }

    const inputFile = process.argv[2];
    const outputFile = process.argv[3];
    const apiKey = process.env.XAI_API_KEY;

    if (!apiKey) {
        console.error('Please set XAI_API_KEY environment variable');
        process.exit(1);
    }

    try {
        const inputText = fs.readFileSync(inputFile, 'utf-8');
        const extractor = new LLMExtractor(apiKey);

        const llmResponse = await extractor.fetchLLMResponse(inputText);
        extractor.saveToMarkdown(llmResponse, outputFile);
    } catch (error) {
        console.error('Failed to save response:', error);
    }
}

main();

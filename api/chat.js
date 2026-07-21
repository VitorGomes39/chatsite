const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inicia o Gemini usando a variável de ambiente secreta configurada na Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async function handler(req, res) {
    // Garante que só aceitamos mensagens enviadas pelo nosso chat (método POST)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido. Use POST.' });
    }

    try {
        // Pega a mensagem que o script.js enviou
        const userMessage = req.body.message;

        if (!userMessage) {
            return res.status(400).json({ error: 'A mensagem está vazia.' });
        }

        // Configura o modelo que vamos usar
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: `Você é uma IA assistente criadora de sites. O usuário vai pedir para você alterar a página, criar jogos ou conversar.
            Você DEVE responder ESTRITAMENTE em formato JSON com as 3 chaves abaixo:
            {
              "reply": "Sua resposta em texto amigável para o chat.",
              "htmlCode": "Se o usuário pedir para criar algo (ex: botão, jogo da velha), coloque o HTML aqui. Senão, retorne null.",
              "cssCode": "Se o usuário pedir para mudar cores/estilo, coloque o CSS aqui. Senão, retorne null."
            }
            Não use crases (\`\`\`) nem a palavra json ao redor da resposta. Retorne APENAS o objeto JSON puro.`
        });

        // Envia a mensagem do usuário para o Gemini
        const result = await model.generateContent(userMessage);
        const responseText = result.response.text();

        // Tenta converter o texto da IA em um objeto Javascript real
        let parsedData;
        try {
            // Limpa eventuais sujeiras (crases de markdown) que a IA possa ter colocado
            const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            parsedData = JSON.parse(cleanText);
        } catch (parseError) {
            // Se a IA se confundir e não gerar um JSON perfeito, mandamos como texto normal
            parsedData = {
                reply: responseText,
                htmlCode: null,
                cssCode: null
            };
        }

        // Devolve a resposta final para o script.js atualizar a tela!
        return res.status(200).json(parsedData);

    } catch (error) {
        console.error('Erro na API do Gemini:', error);
        return res.status(500).json({ reply: 'Deu um erro interno no servidor ao tentar falar com a IA.' });
    }
};

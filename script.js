// Pegando os elementos da página (as partes do HTML que vamos manipular)
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');
const dynamicArea = document.getElementById('dynamic-area');

// Fica escutando quando você aperta "Enviar" ou dá "Enter"
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que a página recarregue
    
    const message = userInput.value.trim();
    if (!message) return; // Se estiver vazio, não faz nada

    // 1. Mostra a sua mensagem na tela e limpa a caixinha
    addMessage(message, 'user');
    userInput.value = '';

    // 2. Coloca um aviso de "Pensando..." enquanto a IA trabalha
    const typingId = addMessage('Pensando...', 'system');

    try {
        // 3. Envia a mensagem para o nosso back-end secreto (api/chat.js)
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        });

        // Recebe a resposta do servidor em formato JSON
        const data = await response.json();

        // 4. Remove o aviso de "Pensando..."
        removeMessage(typingId);

        // 5. Mostra o texto da resposta da IA no chat
        if (data.reply) {
            addMessage(data.reply, 'system');
        }

        // 6. A MÁGICA VISUAL: Se a IA mandar código HTML, coloca na Área Dinâmica!
        if (data.htmlCode) {
            dynamicArea.innerHTML = data.htmlCode;
        }

        // 7. A MÁGICA DE ESTILO: Se a IA mandar CSS, altera a cor/design do site!
        if (data.cssCode) {
            let styleElement = document.getElementById('ai-styles');
            // Se ainda não existir uma tag <style> para a IA, a gente cria
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = 'ai-styles';
                document.head.appendChild(styleElement);
            }
            styleElement.innerHTML = data.cssCode; // Aplica o estilo na hora!
        }

    } catch (error) {
        removeMessage(typingId);
        addMessage('Ops! Erro de conexão. Verifique se a sua API está rodando.', 'system');
        console.error('Erro detalhado:', error);
    }
});

// --- FUNÇÕES AUXILIARES ---

// Função para adicionar a bolha de mensagem no chat
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    const id = 'msg-' + Date.now(); // Cria um ID único
    messageDiv.id = id;
    
    messageDiv.classList.add('message');
    
    if (sender === 'user') {
        messageDiv.classList.add('user-message');
        messageDiv.innerHTML = `<strong>Você:</strong> ${text}`;
    } else {
        messageDiv.classList.add('system-message');
        messageDiv.innerHTML = `<strong>IA:</strong> ${text}`;
    }

    chatMessages.appendChild(messageDiv);
    
    // Rola a barrinha de rolagem sempre pro final
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return id; // Retornamos o ID para poder apagar depois (no caso do "Pensando...")
}

// Função para remover uma mensagem da tela
function removeMessage(id) {
    const msg = document.getElementById(id);
    if (msg) {
        msg.remove();
    }
}

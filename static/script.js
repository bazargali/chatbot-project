// script.js (ТЕК МӘТІНМЕН ЖҰМЫС ІСТЕЙТІН ҚАРАПАЙЫМ НҰСҚА)

const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const messageList = document.getElementById('message-list');
const suggestedQuestions = document.getElementById('suggested-questions');
const suggestionBtns = document.querySelectorAll('.suggestion-btn');
const converter = new showdown.Converter();

// Форма арқылы хабарлама жіберу
chatForm.addEventListener('submit', function(event) {
    event.preventDefault(); 
    const messageText = userInput.value.trim();
    if (messageText) {
        sendMessage(messageText);
    }
});

// Дайын сұрақтарды басқанда хабарлама жіберу
suggestionBtns.forEach(button => {
    button.addEventListener('click', () => {
        const question = button.textContent;
        sendMessage(question);
    });
});

/**
 * Хабарламаны экранға қосып, серверге жіберетін негізгі функция
 */
async function sendMessage(messageText) {
    addMessage(messageText, 'user');
    userInput.value = '';

    if (suggestedQuestions) {
        suggestedQuestions.style.display = 'none';
    }

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: messageText })
        });

        if (!response.ok) { throw new Error('Сервермен байланыста қателік.'); }

        const data = await response.json();
        addMessage(data.reply, 'bot');

    } catch (error) {
        console.error('Қате:', error);
        addMessage('Кешіріңіз, қателік шықты.', 'bot');
    }
}

/**
 * Жаңа хабарламаны чат терезесіне қосады
 */
function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);
    
    const textElement = document.createElement('p');
    
    if (sender === 'bot') {
        const htmlText = converter.makeHtml(text);
        textElement.innerHTML = htmlText;
    } else {
        textElement.textContent = text;
    }
    
    messageElement.appendChild(textElement);
    messageList.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}
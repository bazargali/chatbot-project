// script.js (СУРЕТТІ ЖӘНЕ ТАРИХТЫ ҚОЛДАЙТЫН СОҢҒЫ НҰСҚА)

const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const messageList = document.getElementById('message-list');
const suggestedQuestions = document.getElementById('suggested-questions');
const suggestionBtns = document.querySelectorAll('.suggestion-btn');
const typingIndicator = document.getElementById('typing-indicator');
const converter = new showdown.Converter();

let chatHistory = [];

document.addEventListener('DOMContentLoaded', () => {
    loadChatHistory();
});

chatForm.addEventListener('submit', function(event) {
    event.preventDefault(); 
    const messageText = userInput.value.trim();
    if (messageText) {
        sendMessage(messageText);
    }
});

suggestionBtns.forEach(button => {
    button.addEventListener('click', () => {
        const question = button.textContent;
        sendMessage(question);
    });
});

async function sendMessage(messageText) {
    addMessage(messageText, 'user');
    userInput.value = '';

    if (suggestedQuestions) {
        suggestedQuestions.style.display = 'none';
    }

    typingIndicator.style.display = 'flex';
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: messageText })
        });

        if (!response.ok) { throw new Error('Сервермен байланыста қателік.'); }

        const data = await response.json();
        addMessage(data.reply, 'bot', true, data.image_url);

    } catch (error) {
        console.error('Қате:', error);
        addMessage('Кешіріңіз, қателік шықты. Кейінірек қайталап көріңіз.', 'bot');
    } finally {
        typingIndicator.style.display = 'none';
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

function addMessage(text, sender, save = true, image_url = null) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);
    
    const textElement = document.createElement('p');
    if (sender === 'bot') {
        textElement.innerHTML = converter.makeHtml(text);
    } else {
        textElement.textContent = text;
    }
    messageElement.appendChild(textElement);

    if (image_url) {
        const imageElement = document.createElement('img');
        imageElement.src = image_url;
        imageElement.classList.add('message-image');
        messageElement.appendChild(imageElement);
    }
    
    messageList.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (save) {
        const historyEntry = { text, sender };
        if (image_url) {
            historyEntry.image_url = image_url;
        }
        chatHistory.push(historyEntry);
        saveChatHistory();
    }
}

function saveChatHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

function loadChatHistory() {
    const savedHistory = localStorage.getItem('chatHistory');
    messageList.innerHTML = '';

    if (savedHistory && JSON.parse(savedHistory).length > 0) {
        chatHistory = JSON.parse(savedHistory);
        chatHistory.forEach(message => {
            addMessage(message.text, message.sender, false, message.image_url);
        });
        if (suggestedQuestions) {
            suggestedQuestions.style.display = 'none';
        }
    } else {
        chatHistory = [];
        addMessage('Сәлеметсіз бе! Мен колледж көмекшісімін. Сізге қандай ақпарат қажет?', 'bot', true);
        if (suggestedQuestions) {
            suggestedQuestions.style.display = 'flex';
        }
    }
}
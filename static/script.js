// script.js (СҰХБАТ ТАРИХЫН САҚТАУ ФУНКЦИЯСЫМЕН)

const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const messageList = document.getElementById('message-list');
const suggestedQuestions = document.getElementById('suggested-questions');
const suggestionBtns = document.querySelectorAll('.suggestion-btn');
const converter = new showdown.Converter();

// --- ЖАҢА: Сұхбат тарихын сақтайтын массив ---
let chatHistory = [];

// --- EVENT LISTENERS (Өзгеріссіз) ---
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

// --- НЕГІЗГІ ФУНКЦИЯЛАР ---

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
        addMessage('Кешіріңіз, қателік шықты. Кейінірек қайталап көріңіз.', 'bot');
    }
}

/**
 * Жаңа хабарламаны чат терезесіне қосады және тарихты сақтайды
 * @param {boolean} save - Тарихқа сақтау керек пе, жоқ па
 */
function addMessage(text, sender, save = true) {
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

    // --- ЖАҢА: Хабарламаны тарихқа және localStorage-ке сақтау ---
    if (save) {
        chatHistory.push({ text, sender });
        saveChatHistory();
    }
}

// --- ЖАҢА: Тарихты localStorage-ке сақтайтын функция ---
function saveChatHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

// --- ЖАҢА: Бет жүктелгенде тарихты экранға шығаратын функция ---
function loadChatHistory() {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
        chatHistory = JSON.parse(savedHistory);
        
        // Бастапқы хабарламаларды тазалап, сақталған тарихты көрсетеміз
        messageList.innerHTML = ''; 
        
        chatHistory.forEach(message => {
            addMessage(message.text, message.sender, false); // false - қайтадан сақтамау үшін
        });

        // Егер сұхбат басталған болса, ұсынылатын сұрақтарды жасырамыз
        if (chatHistory.length > 1) {
             if (suggestedQuestions) {
                suggestedQuestions.style.display = 'none';
            }
        }
    }
}

// --- Беттің ең бірінші жүктелуі ---
document.addEventListener('DOMContentLoaded', (event) => {
    loadChatHistory();
});
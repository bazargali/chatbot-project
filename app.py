# app.py (БАРЛЫҚ ҚАТЕЛЕРІ ТҮЗЕТІЛГЕН СОҢҒЫ НҰСҚА)

import os
import re
import google.generativeai as genai
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='static')
CORS(app)

KNOWLEDGE_BASE_FILE = "knowledge_base.txt"

# --- Gemini AI моделін конфигурациялаймыз ---
try:
    gemini_api_key = os.environ.get("GOOGLE_API_KEY")
    if not gemini_api_key: raise ValueError("GOOGLE_API_KEY табылмады!")
    genai.configure(api_key=gemini_api_key)
    
    system_instruction = "You are a professional assistant for Aktobe Higher Polytechnic College. You must strictly respond in the language of the user's last question (Kazakh, Russian, or English). Do not mix languages."
    
    gemini_model = genai.GenerativeModel(
        'gemini-2.5-flash', # Сіздің кілтіңізге қолжетімді дұрыс модель
        system_instruction=system_instruction
    )
    
    print("Gemini AI моделі сәтті қосылды.")

except Exception as e:
    print(f"AI моделін қосуда қателік: {e}")
    gemini_model = None

# --- ФУНКЦИЯЛАР ---
def read_knowledge_base():
    try:
        with open(KNOWLEDGE_BASE_FILE, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return ""

def format_history(history):
    """Сұхбат тарихын мәтінге айналдырады."""
    if not history:
        return ""
    formatted_string = ""
    for message in history:
        if 'role' in message and 'parts' in message and message['parts']:
            role = "Пайдаланушы" if message['role'] == 'user' else "Көмекші"
            formatted_string += f"{role}: {message['parts'][0]['text']}\n"
    return formatted_string

def build_prompt(question, context, history_str):
    """Сұхбат тарихын ескеретін жаңа промпт."""
    return f"""
<instructions>
    <role>Сен — "Assistant Bala", Ақтөбе жоғары политехникалық колледжінің достық көмекшісісің.</role>
    <rules>
        <rule>1. Жауапты МІНДЕТТІ ТҮРДЕ пайдаланушының соңғы сұрағының тілінде қайтар.</rule>
        <rule>2. Алдымен `<history>` бөлімін оқып, әңгіменің не туралы екенін түсін. "Оның", "сол" сияқты есімдіктер алдыңғы хабарламаларға қатысты болуы мүмкін.</rule>
        <rule>3. `<context>` ішіндегі ақпаратты қолданып, `<question>`-ға жауап бер.</rule>
        <rule>4. МАҢЫЗДЫ ЕРЕЖЕ: Егер сұралған ақпаратта адам туралы дерек және оның суретінің жолы (`Суреті:/static/...`) болса, жауабыңа сол суреттің жолын МІНДЕТТІ ТҮРДЕ қос.</rule>
        <rule>5. Егер сұрақтың жауабы `<context>` ішінде табылмаса, сұрақ қойылған тілде былай деп жауап бер: "Кешіріңіз, менде бұл сұрақ бойынша нақты ақпарат жоқ. Толығырақ ақпарат алу үшін 206-кабинетке (Оқу бөлімі) жүгінуіңізге болады."</rule>
    </rules>
</instructions>

<history>
{history_str}
</history>

<context>
{context}
</context>

<question>
{question}
</question>
"""

# --- НЕГІЗГІ МАРШРУТТАР ---
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/chat', methods=['POST'])
def chat():
    if gemini_model is None:
        return jsonify({'error': 'Gemini моделі іске қосылмаған.'}), 500
    
    try:
        data = request.get_json()
        user_message = data.get('message')
        history = data.get('history', [])

        if history:
            history = history[:-1]

        if not user_message:
            return jsonify({'error': 'Хабарлама табылмады'}), 400
        
        knowledge_context = read_knowledge_base()
        history_str = format_history(history)
        
        # ---!!! ОСЫ ЖЕР ТҮЗЕТІЛДІ !!!---
        # Енді сұхбат тарихын AI-ға жібереміз
        prompt = build_prompt(user_message, knowledge_context, history_str)
        # ---!!! ТҮЗЕТУ АЯҚТАЛДЫ !!!---
        
        response = gemini_model.generate_content(prompt)
        bot_response_text = response.text
        
        image_url = None
        match = re.search(r'(/static/images/staff/[^\s]+(\.jpg|\.jpeg|\.png|\.gif))', bot_response_text, re.IGNORECASE)
        
        if match:
            image_url = match.group(1)
            # Суреттің сілтемесін, оның алдындағы сөзді және артық бос орындарды толығымен өшіреміз
            bot_response_text = re.sub(r'\*?\*?(Суреті|Фото|Photo)\*?\*?:\s*' + re.escape(image_url), '', bot_response_text, flags=re.IGNORECASE)
            bot_response_text = os.linesep.join([s for s in bot_response_text.splitlines() if s])

        return jsonify({'reply': bot_response_text.strip(), 'image_url': image_url})

    except Exception as e:
        print(f"Chat функциясында қате: {e}")
        return jsonify({'reply': "Кешіріңіз, серверде ішкі қателік болды."}), 500

# --- Серверді іске қосу ---
if __name__ == '__main__':
    app.run(debug=True)
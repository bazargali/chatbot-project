# app.py (ЕҢ СОҢҒЫ ТОЛЫҚ НҰСҚА)

import os
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
        'gemini-2.5-flash', # Ең сенімді және үйлесімді модель
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
        print(f"Ескерту: '{KNOWLEDGE_BASE_FILE}' файлы табылмады.")
        return ""

def build_prompt(question, context):
    return f"""
<instructions>
    <role>Сен — Ақтөбе жоғары политехникалық колледжінің мейірімді әрі кәсіби көмекшісісің.</role>
    <rules>
        <rule>1. Пайдаланушының сұрағының тілін анықтап, жауапты МІНДЕТТІ ТҮРДЕ сол тілде қайтар.</rule>
        <rule>2. Алдымен сұрақтың жауабын `<context>` ішінен ізде. Егер жауап табылса, сол ақпаратты қолданып жауап бер.</rule>
        <rule>3. Егер сұрақтың жауабы `<context>` ішінде табылмаса, "менде ондай ақпарат жоқ" деп бірден айтпа. Оның орнына:
            a) Алдымен сұрақты колледж, оқу немесе студенттік өмір тақырыбына жақындатып, жалпы біліміңді қолданып жауап беруге тырыс.
            b) Егер сұрақ колледж тақырыбына мүлдем қатысы жоқ болса, онда сыпайы түрде өз негізгі мақсатыңды еске сал. Мысалы: 'Менің негізгі мақсатым — колледж туралы сұрақтарға жауап беру.'
        </rule>
        <rule>4. Жауабыңды толық, анық және пайдаланушыға мейірімді стильде жаз.</rule>
    </rules>
</instructions>
<context>{context}</context>
<question>{question}</question>
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
        if not user_message:
            return jsonify({'error': 'Хабарлама табылмады'}), 400
        
        knowledge_context = read_knowledge_base()
        prompt = build_prompt(user_message, knowledge_context)
        response = gemini_model.generate_content(prompt)
        bot_response = response.text
        
        return jsonify({'reply': bot_response})

    except Exception as e:
        print(f"Chat функциясында қате: {e}")
        return jsonify({'reply': "Кешіріңіз, серверде ішкі қателік болды."}), 500

# --- Серверді іске қосу ---
if __name__ == '__main__':
    app.run(debug=True)
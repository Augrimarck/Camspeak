import easyocr
import time
import os
from flask import Flask, render_template, request, url_for, redirect, session
from werkzeug.utils import secure_filename
from gtts import gTTS

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'

UPLOAD_FOLDER = 'static/uploads'
AUDIO_FOLDER = 'static/audio'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(AUDIO_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html',
                           image_path=session.pop('image_path', None),
                           ocr_text=session.pop('ocr_text', None),
                           audio_path=session.pop('audio_path', None),
                           word_count=session.pop('word_count', None),
                           average_confidence=session.pop('average_confidence', None),
                           ocr_time=session.pop('ocr_time', None))

@app.route('/ocr', methods=['POST'])
def ocr():
    import time
    if 'image' not in request.files:
        return "No file part"
    
    file = request.files['image']
    if file.filename == '':
        return "No selected file"
    
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        # Mulai waktu OCR
        start_time = time.time()

        # Proses OCR (baca teks saja tanpa detail)
        reader = easyocr.Reader(['id', 'en'])
        result = reader.readtext(filepath, detail=1)  # gunakan detail=1 agar bisa ambil confidence
        end_time = time.time()

        # Ambil hanya teks dan confidence
        extracted_text_list = []
        confidences = []

        for _, text, conf in result:
            if text.strip():
                extracted_text_list.append(text.strip())
                confidences.append(conf)

        # Gabungkan semua teks
        extracted_text = '\n'.join(extracted_text_list)

        # Hitung rata-rata confidence dan jumlah kata
        average_conf = round(sum(confidences) / len(confidences) * 100, 2) if confidences else 0
        word_count = len(extracted_text.split())

        # Proses TTS jika ada teks
        audio_path = None
        if extracted_text.strip():
            tts = gTTS(text=extracted_text, lang='id')
            audio_filename = filename.rsplit('.', 1)[0] + '.mp3'
            audio_path_fs = os.path.join(AUDIO_FOLDER, audio_filename)
            tts.save(audio_path_fs)
            audio_path = f'/static/audio/{audio_filename}'

        # Simpan ke session
        session['ocr_text'] = extracted_text
        session['image_path'] = f'/static/uploads/{filename}'
        session['audio_path'] = audio_path
        session['word_count'] = word_count
        session['average_confidence'] = average_conf
        session['ocr_time'] = round(end_time - start_time, 2)

        return redirect(url_for('index') + '#coba-sekarang')

    return "Something went wrong"


if __name__ == '__main__':
    app.run(debug=True)
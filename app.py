import os
import cv2
import numpy as np
import base64
import uuid
from flask import Flask, request, redirect, url_for, session, render_template
from gtts import gTTS
import easyocr

app = Flask(__name__)
app.secret_key = 'secret'

UPLOAD_FOLDER = 'static/uploads'
AUDIO_FOLDER = 'static/audio'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(AUDIO_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html',
                           image_path=session.pop('image_path', None),
                           ocr_text=session.pop('ocr_text', None),
                           audio_path=session.pop('audio_path', None))

@app.route('/detect_paper', methods=['POST'])
def detect_paper():
    data = request.get_json()
    img_data = data['image'].split(',')[1]
    img_bytes = base64.b64decode(img_data)
    filename = f"{uuid.uuid4().hex}.png"
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    with open(filepath, 'wb') as f:
        f.write(img_bytes)

    # Baca gambar pakai OpenCV
    img = cv2.imread(filepath)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blur, 75, 200)

    # Cari kontur
    contours, _ = cv2.findContours(edged.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:5]

    # Cari kontur terbesar berbentuk persegi
    screenCnt = None
    for c in contours:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4:
            screenCnt = approx
            break

    if screenCnt is not None:
        cv2.drawContours(img, [screenCnt], -1, (0, 255, 0), 2)

    # Simpan hasil deteksi
    detected_filename = f"detected_{filename}"
    detected_path = os.path.join(UPLOAD_FOLDER, detected_filename)
    cv2.imwrite(detected_path, img)

    # OCR (opsional)
    reader = easyocr.Reader(['id', 'en'])
    result = reader.readtext(detected_path, detail=0)
    extracted_text = '\n'.join(result)

    # TTS
    audio_path = None
    if extracted_text:
        tts = gTTS(text=extracted_text, lang='id')
        audio_filename = filename.rsplit('.', 1)[0] + '.mp3'
        audio_path_fs = os.path.join(AUDIO_FOLDER, audio_filename)
        tts.save(audio_path_fs)
        audio_path = f'/static/audio/{audio_filename}'

    session['image_path'] = f'/static/uploads/{detected_filename}'
    session['ocr_text'] = extracted_text
    session['audio_path'] = audio_path

    return redirect(url_for('index') + '#coba-sekarang')

if __name__ == '__main__':
    app.run(debug=True)

import os
import time
import base64
from flask import Flask, request, render_template, redirect, url_for, session
from gtts import gTTS
import easyocr
from pdf2image import convert_from_path
from langdetect import detect
import cv2
from flask_session import Session

# === Konfigurasi Folder ===
UPLOAD_FOLDER = 'static/uploads'
AUDIO_FOLDER = 'static/audio'
POPPLER_PATH = r'poppler-24.02.0\Library\bin'  # sesuaikan kalau perlu

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(AUDIO_FOLDER, exist_ok=True)

app = Flask(__name__)
app.secret_key = "rahasia_aman"

# === Konfigurasi Server-side Session ===
from flask_session import Session
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_FILE_DIR"] = os.path.join(os.getcwd(), "flask_session")
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_USE_SIGNER"] = True
app.config["SESSION_KEY_PREFIX"] = "ocrapp_"
Session(app)

reader = easyocr.Reader(['id', 'en'])

# ====== Fungsi TTS ======
def save_tts(text, output_name):
    """Konversi teks ke audio dengan prioritas: Indonesia → English."""
    audio_path = os.path.join(AUDIO_FOLDER, output_name + '.mp3')
    if not text.strip():
        return None

    try:
        # Coba deteksi bahasa
        detected = detect(text)
    except:
        detected = "id"   # fallback jika gagal deteksi

    # === PRIORITAS BAHASA ===
    if detected not in ["id", "en"]:
        language = "id"   # PRIORITAS pertama Indonesia
    else:
        language = detected

    try:
        tts = gTTS(text=text, lang=language)
        tts.save(audio_path)
        return "/" + audio_path.replace("\\", "/")
    except:
        # Jika tetap error, fallback ke English (prioritas kedua)
        try:
            tts = gTTS(text=text, lang="en")
            tts.save(audio_path)
            return "/" + audio_path.replace("\\", "/")
        except Exception as e:
            print("TTS Error:", e)
            return None

# ====== Fungsi Bantu ======
def format_text_by_words(text, words_per_line=25, separator=" \n "):
    """Memecah teks menjadi baris berdasarkan jumlah kata."""
    words = text.split()
    lines = []
    # Mengubah separator menjadi '\n' agar saat ditampilkan di web/terminal
    # hasil formatnya berupa baris baru (newline)
    for i in range(0, len(words), words_per_line):
        line = " ".join(words[i:i+words_per_line])
        lines.append(line)
    # Ubah separator menjadi '\n' agar tampil per baris di HTML/Terminal
    return "\n".join(lines)

# ====== Fungsi OCR tunggal (gambar atau PDF) ======
def ocr_single(filepath, filename):
    import cv2  # pastikan cv2 diimpor
    ocr_pages = []

    if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        # === 🧹 Tahap Penghilangan Noise (Gaussian Blur) ===
        # img = cv2.imread(filepath)
        # if img is not None:
        #     img = cv2.GaussianBlur(img, (3, 3), 0)
        #     cv2.imwrite(filepath, img)

        # === 🕵️‍♂️ Mulai Proses OCR ===
        start = time.time()
        result = reader.readtext(filepath, detail=1)

        # Gabungkan hasil OCR jadi satu string
        extracted_full = " ".join([txt for _, txt, _ in result if txt.strip()])

        extracted = format_text_by_words(extracted_full, 25)
        preprocessed = format_text_by_words(extracted_full.lower(), 25)

        confs = [conf for _, _, conf in result]
        audio = save_tts(extracted_full.lower(), os.path.splitext(filename)[0] + "_page1")

        image_url = "/" + filepath.replace("\\", "/")

        ocr_pages.append({
            "page_num": 1,
            "text": extracted,
            "lower": preprocessed,
            "audio": audio,
            "image": image_url,
            "word_count": len(extracted_full.split()),
            "confidence": (sum(confs) / len(confs)) if confs else 0,
            "ocr_time": round(time.time() - start, 2)
        })

    elif filename.lower().endswith('.pdf'):
        pages = convert_from_path(filepath, dpi=200, poppler_path=POPPLER_PATH)
        for i, page in enumerate(pages, start=1):
            page_img = os.path.join(UPLOAD_FOLDER, f"{os.path.splitext(filename)[0]}_hal{i}.jpg")
            page.save(page_img, "JPEG")

            # # === 🧹 Tahap Penghilangan Noise (Gaussian Blur) untuk halaman PDF ===
            # img = cv2.imread(page_img)
            # if img is not None:
            #     img = cv2.GaussianBlur(img, (3, 3), 0)
            #     cv2.imwrite(page_img, img)

            start = time.time()
            result = reader.readtext(page_img, detail=1)
            extracted_full = " ".join([txt for _, txt, _ in result if txt.strip()])

            extracted = format_text_by_words(extracted_full, 25)
            preprocessed = format_text_by_words(extracted_full.lower(), 25)

            confs = [conf for _, _, conf in result]
            audio = save_tts(extracted_full.lower(), os.path.splitext(filename)[0] + f"_page{i}")

            image_url = "/" + page_img.replace("\\", "/")

            ocr_pages.append({
                "page_num": i,
                "text": extracted,
                "lower": preprocessed,
                "audio": audio,
                "image": image_url,
                "word_count": len(extracted_full.split()),
                "confidence": (sum(confs) / len(confs)) if confs else 0,
                "ocr_time": round(time.time() - start, 2)
            })
    return ocr_pages

# ====== Route: Buku & Poster (mendukung camera & upload via 'files') ======
@app.route('/buku', methods=['POST'])
@app.route('/poster', methods=['POST'])
def proses_ocr_tunggal():
    ocr_pages = []
    camera_data = request.form.get("camera_image")

    # Mode kamera (data base64)
    if camera_data:
        header, encoded = camera_data.split(",", 1)
        image_bytes = base64.b64decode(encoded)
        filename = f"camera_{int(time.time())}.png"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        with open(filepath, "wb") as f:
            f.write(image_bytes)
        ocr_pages = ocr_single(filepath, filename)

    # Mode upload file (dikirim sebagai 'files' array oleh JS)
    else:
        files = request.files.getlist("files")
        if not files:
            # fallback: coba ambil 'file' satuan (untuk submit form tradisional)
            single = request.files.get("file")
            if single:
                files = [single]
        if not files:
            return "Tidak ada file yang diupload", 400

        # pakai file pertama untuk route tunggal (buku/poster)
        file = files[0]
        filename = file.filename
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        ocr_pages = ocr_single(filepath, filename)

    session["ocr_pages"] = ocr_pages
    return redirect(url_for("index"))

# ====== Route: OCR Multiple (mengolah banyak file sekaligus) ======
@app.route('/ocr_multiple', methods=['POST'])
def ocr_multiple():
    files = request.files.getlist('files')
    if not files:
        return redirect(url_for('index'))

    ocr_pages = []
    for i, file in enumerate(files, start=1):
        # beri nama unik
        filename = f"multi_{int(time.time())}_{i}.png"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        ocr_pages += ocr_single(filepath, filename)

    session['ocr_pages'] = ocr_pages
    return redirect(url_for('index'))

# ====== Route Index ======
@app.route('/')
def index():
    ocr_pages = session.pop('ocr_pages', None)
    return render_template("index.html", ocr_pages=ocr_pages)

# ====== Jalankan Flask ======
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

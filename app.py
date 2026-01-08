import os
import time
import base64
from flask import Flask, request, render_template, redirect, url_for, session
from gtts import gTTS
import easyocr
from pdf2image import convert_from_path
from langdetect import detect
from flask_session import Session
# from rapidfuzz import process
import re
import cv2
import numpy as np
# from wordlists.words_id import WORD_LIST_ID
# from wordlists.words_en import WORD_LIST_EN


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

# === Fungsi Preprocessing Baru ===
def apply_gaussian_blur(image_path):
    # Baca gambar menggunakan OpenCV
    img = cv2.imread(image_path)
    if img is None:
        return None

    # Terapkan Gaussian Blur
    blurred = cv2.GaussianBlur(img, (3, 3), 0)

    # Simpan kembali ke path yang sama (menimpa gambar asli untuk diproses OCR)
    cv2.imwrite(image_path, blurred)
    return image_path

def normalize_word(word):
    return re.sub(r'^[^a-zA-Z0-9,.]+|[^a-zA-Z0-9,.]+$', '', word)

def auto_correct_text(text):
    try:
        lang = detect(text)
    except:
        lang = "id"

    if lang == "en":
        corrected_text = correct_english_text(text)
        used_lang = "en"
    else:
        corrected_text = correct_indonesian_text(text)
        used_lang = "id"

    return corrected_text, used_lang



def pre_ocr_fix_id(word):
    """Koreksi manual khusus Bahasa Indonesia."""
    fixes = [
        # === Pola khas OCR Indonesia ===
        ("kct", "ket"),        
        ("ct", "et"),          # detcsi → deteksi
        ("sc", "se"),          # scluruh → seluruh
        ("rn", "m"),           # rnanusia → manusia
        ("dcngan", "dengan"),
        ("penuli", "peduli"),
        ("kcpada", "kepada"),
        ("vv", "w"),           # vvaktu → waktu
        ("nyo", "nya"),
        ("nyl", "nya"),
        ("rusd1n", "rusdin"),
        ("t0mpo", "tompo"),
        (";", "."),
    ]

    for wrong, right in fixes:
        if wrong in word:
            word = word.replace(wrong, right)
    return word

def pre_ocr_fix_en(word):
    """Koreksi manual khusus Bahasa Inggris."""
    fixes = [
        # === Pola khas OCR Inggris ===
        ("rn", "m"),       # rnode → mode
        ("vv", "w"),       # vvorld → world
        ("cl", "d"),       # c1ass → dlass
        ("teh", "the"),
        ("fro", "for"),
        ("witb", "with"),
        ("l1", "li"),      # appl1cation → application
        (";", "."),
    ]

    for wrong, right in fixes:
        if wrong in word:
            word = word.replace(wrong, right)
    return word


def correct_indonesian_text(text): 
    words = text.lower().split()
    corrected_words = []

    for word in words:
        clean_word = normalize_word(word)
        if not clean_word: continue
        
        # Panggil fungsi khusus Indonesia
        word_fixed = pre_ocr_fix_id(clean_word)
        corrected_words.append(word_fixed)

    return " ".join(corrected_words)

def correct_english_text(text): 
    words = text.lower().split()
    corrected_words = []

    for word in words:
        clean_word = normalize_word(word)
        if not clean_word: continue

        # Panggil fungsi khusus Inggris
        word_fixed = pre_ocr_fix_en(clean_word)
        corrected_words.append(word_fixed)

    return " ".join(corrected_words)

# ====== Fungsi Sort EasyOCR ======
def sort_easyocr_result(result, y_threshold=15):
    lines = []
    for bbox, text, conf in result:
        y = bbox[0][1]
        placed = False
        for line in lines:
            if abs(line['y'] - y) < y_threshold:
                line['items'].append((bbox, text))
                placed = True
                break
        if not placed:
            lines.append({'y': y, 'items': [(bbox, text)]})

    lines.sort(key=lambda l: l['y'])

    final_text = []
    for line in lines:
        line['items'].sort(key=lambda i: i[0][0][0])
        final_text.append(" ".join(t for _, t in line['items']))

    return " ".join(final_text)

# ====== Fungsi TTS ======
def save_tts(text, output_name, used_lang):
    audio_path = os.path.join(AUDIO_FOLDER, output_name + '.mp3')

    if not text.strip():
        return None

    try:
        tts = gTTS(text=text, lang=used_lang)
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
    ocr_pages = []

    if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        apply_gaussian_blur(filepath) # Benar: filepath adalah gambar
        start = time.time()
        result = reader.readtext(filepath, detail=1)

        # === SORTING BERDASARKAN POSISI ===
        extracted_full = sort_easyocr_result(result)
        raw_text = extracted_full.lower()
        corrected_text, used_lang = auto_correct_text(raw_text)

        extracted = format_text_by_words(extracted_full, 25)
        preprocessed = format_text_by_words(raw_text, 25)

        confs = [conf for _, _, conf in result]
        audio = save_tts(
                    corrected_text,
                    os.path.splitext(filename)[0] + "_page1",
                    used_lang
                )

        image_url = "/" + filepath.replace("\\", "/")

        ocr_pages.append({
            "page_num": 1,
            "text": extracted,
            "lower": preprocessed,
            "corrected": corrected_text,
            "language": used_lang,  # 👈 TAMBAHKAN INI
            "audio": audio,
            "image": image_url,
            "word_count": len(extracted_full.split()),
            "confidence": (sum(confs) / len(confs)) if confs else 0,
            "ocr_time": round(time.time() - start, 2)
        })

    elif filename.lower().endswith('.pdf'):
        pages = convert_from_path(filepath, dpi=200, poppler_path=POPPLER_PATH)

        for i, page in enumerate(pages, start=1):
            page_img = os.path.join(
                UPLOAD_FOLDER, f"{os.path.splitext(filename)[0]}_hal{i}.jpg"
            )
            page.save(page_img, "JPEG")
            
            # --- PERBAIKAN DI SINI ---
            apply_gaussian_blur(page_img) # Harus page_img, bukan filepath
            # -------------------------
            
            start = time.time()
            result = reader.readtext(page_img, detail=1)

            # === SORTING BERDASARKAN POSISI ===
            extracted_full = sort_easyocr_result(result)
            raw_text = extracted_full.lower()
            corrected_text, used_lang = auto_correct_text(raw_text)

            extracted = format_text_by_words(extracted_full, 25)
            preprocessed = format_text_by_words(raw_text, 25)

            confs = [conf for _, _, conf in result]
            audio = save_tts(
                    corrected_text,
                    os.path.splitext(filename)[0] + f"_page{i}",
                    used_lang
                )

            image_url = "/" + page_img.replace("\\", "/")

            ocr_pages.append({
                "page_num": 1,
                "text": extracted,
                "lower": preprocessed,
                "corrected": corrected_text,
                "language": used_lang,  # 👈 TAMBAHKAN INI
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

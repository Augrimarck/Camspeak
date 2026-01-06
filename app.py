import os
import time
import base64
from flask import Flask, request, render_template, redirect, url_for, session
from gtts import gTTS
import easyocr
from pdf2image import convert_from_path
from langdetect import detect
from flask_session import Session
from rapidfuzz import process
from wordfreq import zipf_frequency

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

def auto_correct_text(text):
    """
    Melakukan koreksi OCR otomatis berdasarkan bahasa yang terdeteksi
    """
    try:
        lang = detect(text)
    except:
        lang = "id"  # fallback aman

    # Prioritas hanya ID dan EN
    if lang == "en":
        corrected = correct_english_text(text)
        used_lang = "en"
    else:
        corrected = correct_indonesian_text(text)
        used_lang = "id"

    return corrected, used_lang


def pre_ocr_fix(word):
    fixes = [
        # === Pola sangat khas OCR (prioritas tinggi) ===
        ("kct", "ket"),        # kctulusan → ketulusan
        ("ct", "et"),          # detcsi → deteksi
        ("sc", "se"),          # scluruh → seluruh
        ("cl", "d"),           # clement → dement (jarang, aman)
        ("rn", "m"),           # rnanusia → manusia
        ("li", "h"),           # kasili → kasih
        ("ll", "l"),           # seIIuruh → seluruh
        ("dcngan", "dengan"),
        ("penuli", "peduli"),
        ("kcpada", "kepada"),

        # === Kesalahan vokal visual ===
        ("0", "o"),
        ("1", "i"),
        ("|", "i"),

        # === Kesalahan konsonan ringan ===
        ("cr", "er"),          # sumbcr → sumber
        ("ci", "ti"),          # pencian → pentian
        ("cj", "tj"),          # jarang, tapi aman
        ("vv", "w"),           # vvaktu → waktu

        # === Awalan sering rusak ===
        ("scb", "seb"),
        ("scl", "sel"),
        ("scr", "ser"),

        # === Akhiran umum bahasa Indonesia ===
        ("lahh", "lah"),
        ("nyo", "nya"),
        ("nyl", "nya"),
    ]

    for wrong, right in fixes:
        if wrong in word:
            word = word.replace(wrong, right)

    return word


def correct_indonesian_text(text, threshold=70, zipf_min=3.5):
    words = text.lower().split()
    corrected_words = []

    for word in words:
        if len(word) < 3 or word.isdigit():
            corrected_words.append(word)
            continue

        word = pre_ocr_fix(word)

        candidates = process.extract(
            word,
            WORD_LIST_ID,
            limit=1
        )

        replaced = False
        for cand, score, _ in candidates:
            freq = zipf_frequency(cand, "id")

            if score >= threshold and freq >= zipf_min:
                corrected_words.append(cand)
                replaced = True
                break

        if not replaced:
            corrected_words.append(word)

    return " ".join(corrected_words)

WORD_LIST_ID = [
    # === Umum teknis ===
    "data", "dataset", "informasi", "sistem", "metode", "proses",
    "input", "output", "hasil", "analisis", "evaluasi", "akurasi",
    "efisiensi", "efektif", "validasi", "error",

    # === OCR & TTS ===
    "ocr", "teks", "gambar", "citra", "kamera", "pemindaian",
    "deteksi", "ekstraksi", "pengenalan", "karakter",
    "suara", "audio", "pelafalan", "pembacaan",

    # === Web & aplikasi ===
    "aplikasi", "website", "web", "antarmuka", "interaktif",
    "framework", "flask", "bootstrap", "server",
    "modul", "fitur", "fungsi",

    # === Pengembangan sistem ===
    "perancangan", "pengembangan", "implementasi",
    "pengujian", "pemrosesan", "integrasi",
    "iterasi", "agile", "flowchart",

    # === Akademik ===
    "penelitian", "skripsi", "bab", "tabel", "diagram",
    "variabel", "parameter", "pengukuran",
    "kesimpulan", "pembahasan",

    # === Bahasa ===
    "bahasa", "indonesia", "inggris",
    "deteksi", "koreksi",

    # === Aksesibilitas (nilai tambah) ===
    "tunanetra", "aksesibilitas", "inklusif",

    # === Lainnya (spesifik sistem) ===
    "camspeak", "otomatis", "visual", "digital"
]


def pre_ocr_fix_en(word):
    fixes = [
        # === OCR visual confusion (high priority) ===
        ("rn", "m"),       # rnode → mode
        ("vv", "w"),       # vvorld → world
        ("cl", "d"),       # c1ass → dlass (jarang, relatif aman)
        ("|", "i"),        # th|s → this
        ("1", "i"),        # th1s → this
        ("0", "o"),        # c0nvert → convert
        ("5", "s"),        # cla5s → class
        ("8", "b"),        # num8er → number

        # === Common OCR swaps ===
        ("l1", "li"),      # appl1cation → application
        ("li", "ll"),      # modali → modall (case tertentu)
        ("ci", "ti"),      # funccion → function
        ("rn", "m"),       # moder → modern

        # === Repeated characters ===
        ("lll", "ll"),
        ("ii", "i"),

        # === Ending corrections ===
        ("teh", "the"),
        ("fro", "for"),
        ("witb", "with"),
    ]

    for wrong, right in fixes:
        if wrong in word:
            word = word.replace(wrong, right)

    return word

def correct_english_text(text, threshold=70, zipf_min=3.0):
    words = text.lower().split()
    corrected_words = []

    for word in words:
        if len(word) < 3 or word.isdigit():
            corrected_words.append(word)
            continue

        # Pre-fix OCR
        word = pre_ocr_fix_en(word)

        candidates = process.extract(
            word,
            WORD_LIST_EN,
            limit=1
        )

        replaced = False
        for cand, score, _ in candidates:
            freq = zipf_frequency(cand, "en")

            if score >= threshold and freq >= zipf_min:
                corrected_words.append(cand)
                replaced = True
                break

        if not replaced:
            corrected_words.append(word)

    return " ".join(corrected_words)

WORD_LIST_EN = [
    "a", "about", "access", "accuracy", "active", "adaptive", "algorithm",
    "analysis", "application", "approach", "architecture", "audio",
    "automatic", "available", "based", "basic", "camera", "character",
    "classification", "component", "computer", "convert", "data", "dataset",
    "detection", "digital", "document", "efficiency", "effective",
    "evaluation", "feature", "framework", "function", "image", "implementation",
    "information", "input", "interface", "language", "method", "model",
    "module", "network", "object", "optical", "output", "performance",
    "process", "processing", "recognition", "result", "scanner", "system",
    "technology", "text", "speech", "voice", "visual", "website"
]


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
    ocr_pages = []

    if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        start = time.time()
        result = reader.readtext(filepath, detail=1)

        extracted_full = " ".join([txt for _, txt, _ in result if txt.strip()])
        raw_text = extracted_full.lower()
        corrected_text, detected_lang = auto_correct_text(raw_text)

        extracted = format_text_by_words(extracted_full, 25)
        preprocessed = format_text_by_words(raw_text, 25)

        confs = [conf for _, _, conf in result]
        audio = save_tts(corrected_text, os.path.splitext(filename)[0] + "_page1")

        image_url = "/" + filepath.replace("\\", "/")

        ocr_pages.append({
            "page_num": 1,
            "text": extracted,
            "lower": preprocessed,
            "corrected": corrected_text,   # ⬅ penting untuk analisis
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

            start = time.time()
            result = reader.readtext(page_img, detail=1)

            extracted_full = " ".join([txt for _, txt, _ in result if txt.strip()])
            raw_text = extracted_full.lower()
            corrected_text, detected_lang = auto_correct_text(raw_text)

            extracted = format_text_by_words(extracted_full, 25)
            preprocessed = format_text_by_words(raw_text, 25)

            confs = [conf for _, _, conf in result]
            audio = save_tts(corrected_text, os.path.splitext(filename)[0] + f"_page{i}")

            image_url = "/" + page_img.replace("\\", "/")

            ocr_pages.append({
                "page_num": i,
                "text": extracted,
                "lower": preprocessed,
                "corrected": corrected_text,
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

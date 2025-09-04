import os
import re
import time
from flask import Flask, request, render_template, redirect, url_for, session
from gtts import gTTS
import easyocr
from pdf2image import convert_from_path
from PIL import Image
from langdetect import detect  # 🔥 deteksi bahasa otomatis
import base64

# === Konfigurasi ===
UPLOAD_FOLDER = 'static/uploads'
AUDIO_FOLDER = 'static/audio'
POPPLER_PATH = r'poppler-24.02.0\Library\bin'  # ganti path sesuai komputer Anda

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(AUDIO_FOLDER, exist_ok=True)

app = Flask(__name__)
app.secret_key = "rahasia_aman"  # wajib untuk session
reader = easyocr.Reader(['id', 'en'])


# ========= FUNGSI OCR POSTER (pakai layout aware) =========
def order_easyocr_by_layout(result, col_overlap_thresh=0.30, line_center_tol=0.60):
    items = []
    for entry in result:
        if not entry or len(entry) < 3:
            continue
        bbox, text, conf = entry
        if not text.strip():
            continue
        xs = [p[0] for p in bbox]
        ys = [p[1] for p in bbox]
        x_min, x_max = min(xs), max(xs)
        y_min, y_max = min(ys), max(ys)
        w = max(1.0, x_max - x_min)
        h = max(1.0, y_max - y_min)
        items.append({
            "text": text.strip(),
            "conf": float(conf),
            "x_min": x_min, "x_max": x_max,
            "y_min": y_min, "y_max": y_max,
            "x_ctr": (x_min + x_max) / 2.0,
            "y_ctr": (y_min + y_max) / 2.0,
            "w": w, "h": h
        })

    if not items:
        return "", []

    # kelompok kolom
    columns = []
    for it in sorted(items, key=lambda d: d["x_min"]):
        placed = False
        for col in columns:
            left = max(it["x_min"], col["x_min"])
            right = min(it["x_max"], col["x_max"])
            inter = max(0.0, right - left)
            union = max(it["x_max"], col["x_max"]) - min(it["x_min"], col["x_min"])
            overlap_ratio = inter / union if union > 0 else 0.0
            if overlap_ratio >= col_overlap_thresh:
                col["items"].append(it)
                col["x_min"] = min(col["x_min"], it["x_min"])
                col["x_max"] = max(col["x_max"], it["x_max"])
                placed = True
                break
        if not placed:
            columns.append({"x_min": it["x_min"], "x_max": it["x_max"], "items": [it]})

    columns.sort(key=lambda c: c["x_min"])

    ordered_lines, confidences = [], []
    for col in columns:
        col_items = sorted(col["items"], key=lambda d: (d["y_min"], d["x_min"]))
        if not col_items: 
            continue

        def same_line(i, line):
            avg_yc = sum(x["y_ctr"] for x in line) / len(line)
            avg_h  = sum(x["h"] for x in line) / len(line)
            return abs(i["y_ctr"] - avg_yc) <= (max(avg_h, i["h"]) * line_center_tol)

        lines, current = [], [col_items[0]]
        for it in col_items[1:]:
            if same_line(it, current):
                current.append(it)
            else:
                current.sort(key=lambda d: d["x_min"])
                lines.append(current)
                current = [it]
        current.sort(key=lambda d: d["x_min"])
        lines.append(current)

        for line in lines:
            ordered_lines.append(" ".join(x["text"] for x in line))
            confidences.extend(x["conf"] for x in line)

    return "\n".join(ordered_lines), confidences

# ========= FUNGSI BANTU =========
def save_tts(text, output_name):
    """Simpan hasil TTS dari teks lowercase."""
    audio_path = os.path.join(AUDIO_FOLDER, output_name + '.mp3')
    if text.strip():
        try:
            detected_lang = detect(text)
            tts = gTTS(text=text, lang=detected_lang)
            tts.save(audio_path)
            return audio_path
        except Exception as e:
            print(f"TTS Error: {e}")
            return None
    return None


# ========= ROUTE UNTUK POSTER (support kamera & file) =========
@app.route('/poster', methods=['POST'])
def proses_poster():
    camera_data = request.form.get("camera_image")  # cek apakah ada data dari kamera
    filename = None
    filepath = None

    if camera_data:
        # Data dari hidden input (base64)
        header, encoded = camera_data.split(",", 1)
        image_bytes = base64.b64decode(encoded)

        filename = f"camera_capture_{int(time.time())}.png"
        filepath = os.path.join(UPLOAD_FOLDER, filename)

        with open(filepath, "wb") as f:
            f.write(image_bytes)

    else:
        # Data dari file upload biasa
        file = request.files['file']
        filename = file.filename
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

    start_time = time.time()

    extracted_text, confs = "", []
    if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        raw = reader.readtext(filepath, detail=1)
        extracted_text, confs = order_easyocr_by_layout(raw)

    elif filename.lower().endswith('.pdf'):
        pages = convert_from_path(filepath, dpi=200, poppler_path=POPPLER_PATH)
        if pages:
            page = pages[0]
            page_path = os.path.join(
                UPLOAD_FOLDER, f"{os.path.splitext(filename)[0]}_halaman1.jpg"
            )
            page.save(page_path, 'JPEG')
            raw = reader.readtext(page_path, detail=1)
            extracted_text, confs = order_easyocr_by_layout(raw)
            filename = os.path.basename(page_path)

    # === TTS ===
    preprocessed_text = extracted_text.lower()
    audio_path = save_tts(preprocessed_text, os.path.splitext(filename)[0])
    word_count = len(preprocessed_text.split())
    average_conf = sum(confs) / len(confs) if confs else 0
    process_time = round(time.time() - start_time, 2)

    # simpan ke session
    session['ocr_text'] = extracted_text
    session['lower_text'] = preprocessed_text
    session['image_path'] = f"/static/uploads/{filename}"
    session['audio_path'] = audio_path
    session['word_count'] = word_count
    session['average_confidence'] = average_conf
    session['ocr_time'] = process_time

    return redirect(url_for('index'))


# ========= ROUTE UNTUK BUKU (support kamera & file) =========
@app.route('/buku', methods=['POST'])
def proses_buku():
    camera_data = request.form.get("camera_image")  # cek apakah ada data dari kamera
    filename = None
    filepath = None

    if camera_data:
        # Data dari hidden input (base64)
        header, encoded = camera_data.split(",", 1)
        image_bytes = base64.b64decode(encoded)

        filename = f"camera_capture_{int(time.time())}.png"
        filepath = os.path.join(UPLOAD_FOLDER, filename)

        with open(filepath, "wb") as f:
            f.write(image_bytes)

    else:
        # Data dari file upload biasa
        file = request.files['file']
        filename = file.filename
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

    start_time = time.time()

    extracted_text, confs = "", []
    if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        result = reader.readtext(filepath, detail=1)
        extracted_text = "\n".join([text.strip() for _, text, _ in result if text.strip()])
        confs = [conf for _, _, conf in result]

    elif filename.lower().endswith('.pdf'):
        pages = convert_from_path(filepath, dpi=200, poppler_path=POPPLER_PATH)
        if pages:
            page = pages[0]
            page_path = os.path.join(
                UPLOAD_FOLDER, f"{os.path.splitext(filename)[0]}_halaman1.jpg"
            )
            page.save(page_path, 'JPEG')
            result = reader.readtext(page_path, detail=1)
            extracted_text = "\n".join([text.strip() for _, text, _ in result if text.strip()])
            confs = [conf for _, _, conf in result]
            filename = os.path.basename(page_path)

    # === TTS ===
    preprocessed_text = extracted_text.lower()
    audio_path = save_tts(preprocessed_text, os.path.splitext(filename)[0])
    word_count = len(preprocessed_text.split())
    average_conf = sum(confs) / len(confs) if confs else 0
    process_time = round(time.time() - start_time, 2)

    # simpan ke session
    session['ocr_text'] = extracted_text
    session['lower_text'] = preprocessed_text
    session['image_path'] = f"/static/uploads/{filename}"
    session['audio_path'] = audio_path
    session['word_count'] = word_count
    session['average_confidence'] = average_conf
    session['ocr_time'] = process_time

    return redirect(url_for('index'))

# ====== ROUTE INDEX ======
@app.route('/')
def index():
    return render_template("index.html",
        image_path=session.pop("image_path", None),
        ocr_text=session.pop("ocr_text", None),
        lower_text=session.pop("lower_text", None),
        audio_path=session.pop("audio_path", None),
        word_count=session.pop("word_count", None),
        average_confidence=session.pop("average_confidence", None),
        ocr_time=session.pop("ocr_time", None)
    )

# ========= RUN =========
if __name__ == '__main__':
    app.run(debug=True)

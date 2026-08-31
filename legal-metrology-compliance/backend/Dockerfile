FROM python:3.10-slim

# System libraries: pyzbar (libzbar) for barcode calibration, opencv
# (libgl1, glib, legacy X11 libs), weasyprint (pango, cairo, gdk-pixbuf,
# fonts). OCR is a cloud API call now (app/services/ocr_service.py),
# not a local model -- that's the dependency that actually broke things
# (Windows DLL blocks, Render RAM/model-download timeouts). Everything
# else here already worked fine once running in Docker.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libzbar0 \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]

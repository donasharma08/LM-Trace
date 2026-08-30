FROM python:3.10-slim

# Full system library set for this stack, added in one shot to avoid
# another round of "missing .so" errors: pyzbar (libzbar), opencv
# (libgl1, glib, libsm/libxext/libxrender - legacy X11 libs opencv's
# wheel still links against on Debian), weasyprint (pango, cairo,
# gdk-pixbuf, fonts), and torch/easyocr (libgomp for OpenMP).
RUN apt-get update && apt-get install -y --no-install-recommends \
    libzbar0 \
    libgl1 \
    libgdk-pixbuf-2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libgdk-pixbuf2.0-0 \
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

FROM python:3.8.20-slim

WORKDIR /tmp

COPY ./requirements.txt .
RUN pip install -r requirements.txt

COPY ./web /app/web
COPY ./wasm /app/wasm

WORKDIR /app/web

CMD ["gunicorn", "-w", "1", "-b", "0.0.0.0:8000", "wsgi:webapp"]
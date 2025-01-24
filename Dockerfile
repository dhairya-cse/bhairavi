from python:3.8.20-slim

WORKDIR /tmp

COPY ./scripts/requirement.txt .
RUN pip install -r requirement.txt

COPY . /app

WORKDIR /app/web

CMD ["gunicorn", "-w", "1", "-b", "0.0.0.0:8000", "wsgi:webapp"]

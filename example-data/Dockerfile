FROM python:3.13-alpine
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY seed.py backend.py .
COPY sources/ sources/
CMD ["python3", "seed.py"]

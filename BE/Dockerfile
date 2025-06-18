FROM python:3.11-slim

WORKDIR /app
COPY requirement.txt .
RUN pip install --no-cache-dir -r requirement.txt

COPY . .
EXPOSE 8001

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001"]

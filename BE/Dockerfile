FROM python:3.11-slim

WORKDIR /app
COPY requirement.txt .
RUN pip install -r requirement.txt

COPY . .
EXPOSE 8001

CMD ["python", "app.py"]
FROM python:3.12-slim

# Install networking tools and pip dependencies
RUN apt-get update && apt-get install -y \
    iproute2 \
    iputils-ping \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Production Gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]

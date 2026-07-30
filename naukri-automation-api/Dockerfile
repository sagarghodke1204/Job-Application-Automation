# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8001
# Essential for headless chrome
ENV DISPLAY=:99
ENV RUNNING_IN_DOCKER=true

# Install system dependencies
# Install system dependencies
# jq is added to help parse the JSON from Chrome for Testing API
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    gnupg \
    unzip \
    ca-certificates \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Install matching ChromeDriver
# 1. Get the installed Chrome version
# 2. Query the Chrome for Testing API to get the correct driver URL
# 3. Download and unzip
RUN CHROME_VERSION=$(google-chrome --version | awk '{print $3}') \
    && echo "Installed Chrome Version: $CHROME_VERSION" \
    && MAJOR_VERSION=$(echo $CHROME_VERSION | awk -F. '{print $1}') \
    && echo "Major Version: $MAJOR_VERSION" \
    # Fetch the latest generic driver version for this major version (works for stable)
    && DRIVER_URL=$(curl -s "https://googlechromelabs.github.io/chrome-for-testing/latest-versions-per-milestone-with-downloads.json" | jq -r ".milestones.\"$MAJOR_VERSION\".downloads.chromedriver[] | select(.platform == \"linux64\") | .url") \
    && echo "Downloading ChromeDriver from: $DRIVER_URL" \
    && wget -q -O /tmp/chromedriver.zip "$DRIVER_URL" \
    && unzip /tmp/chromedriver.zip -d /tmp/ \
    && mv /tmp/chromedriver-linux64/chromedriver /usr/local/bin/chromedriver \
    && chmod +x /usr/local/bin/chromedriver \
    && rm -rf /tmp/chromedriver.zip /tmp/chromedriver-linux64

# Set environment variable for Python to find the driver
ENV CHROMEDRIVER_PATH=/usr/local/bin/chromedriver

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/

# Expose port
EXPOSE $PORT

# Command to run the app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]

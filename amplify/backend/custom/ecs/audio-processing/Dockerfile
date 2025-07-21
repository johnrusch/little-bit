# Dockerfile for Little Bit Audio Processing Service
# This will be implemented in Phase 2: ECS Audio Processing Container Development

FROM python:3.11-slim

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r audioprocess && useradd -r -g audioprocess audioprocess

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY audio_processor.py .
COPY s3_operations.py .
COPY entrypoint.sh .
COPY utils/ ./utils/

# Make entrypoint executable and set proper ownership
RUN chmod +x entrypoint.sh && chown -R audioprocess:audioprocess /app

# Switch to non-root user
USER audioprocess

# Set the entrypoint
ENTRYPOINT ["./entrypoint.sh"]

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python3 -c "import boto3; print('Health check passed')" || exit 1

# Add labels for metadata
LABEL maintainer="Little Bit Audio Processing Team"
LABEL version="1.0.0"
LABEL description="ECS Fargate container for advanced audio processing"
LABEL project="little-bit"
LABEL service="audio-processing"
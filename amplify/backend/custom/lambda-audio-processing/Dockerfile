# Lambda Container Image for Audio Processing
FROM public.ecr.aws/lambda/python:3.11

# Install system dependencies for audio processing
RUN yum update -y && \
    yum install -y \
    ffmpeg \
    libsndfile1 \
    libsndfile1-dev \
    gcc \
    g++ \
    make \
    && yum clean all

# Install Python audio processing libraries
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy function code
COPY audio_processor.py .
COPY utils/ ./utils/

# Set the CMD to your handler
CMD ["audio_processor.handler"]
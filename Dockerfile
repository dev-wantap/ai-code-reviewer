# Use nginx as base image
FROM nginx:alpine

# Install Python and supervisor
RUN apk add --no-cache \
    python3 \
    py3-pip \
    supervisor \
    curl \
    && ln -sf python3 /usr/bin/python

# Install Python packages using --break-system-packages flag
RUN pip3 install --no-cache-dir --break-system-packages \
    fastapi>=0.104.0 \
    uvicorn>=0.24.0 \
    openai>=1.0.0 \
    python-dotenv>=1.0.0

# Set working directory
WORKDIR /app

# Copy application files
COPY main.py ./
COPY static/ ./static/
COPY .env* ./

# Copy configuration files
COPY nginx.conf /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create necessary directories and set permissions
RUN mkdir -p /var/log/supervisor /var/run \
    && chmod -R 755 /app/static \
    && mkdir -p /etc/supervisor/conf.d

# Remove default nginx configuration (Alpine doesn't have sites-enabled)
RUN rm -f /etc/nginx/conf.d/default.conf

# Expose port 80 for nginx
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start supervisor to manage nginx and FastAPI
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
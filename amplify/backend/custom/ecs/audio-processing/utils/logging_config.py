#!/usr/bin/env python3
"""
CloudWatch Logging Configuration for Little Bit Audio Processing Service
Provides structured logging with CloudWatch integration for monitoring and debugging.
"""

import os
import sys
import json
import logging
import logging.handlers
import traceback
from datetime import datetime
from typing import Dict, Any, Optional

class CloudWatchFormatter(logging.Formatter):
    """
    Custom formatter for CloudWatch logs with structured JSON output.
    """
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as structured JSON for CloudWatch."""
        
        # Base log entry structure
        log_entry = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # Add execution context
        if hasattr(record, 'user_id'):
            log_entry['user_id'] = record.user_id
        if hasattr(record, 'session_id'):
            log_entry['session_id'] = record.session_id
        if hasattr(record, 's3_key'):
            log_entry['s3_key'] = record.s3_key
        
        # Add performance metrics if available
        if hasattr(record, 'processing_time'):
            log_entry['processing_time_seconds'] = record.processing_time
        if hasattr(record, 'file_size'):
            log_entry['file_size_bytes'] = record.file_size
        if hasattr(record, 'memory_usage'):
            log_entry['memory_usage_mb'] = record.memory_usage
        
        # Add exception information
        if record.exc_info:
            log_entry['exception'] = {
                'type': record.exc_info[0].__name__ if record.exc_info[0] else None,
                'message': str(record.exc_info[1]) if record.exc_info[1] else None,
                'traceback': traceback.format_exception(*record.exc_info)
            }
        
        # Add extra fields from record
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'levelname', 'levelno', 'pathname', 
                          'filename', 'module', 'exc_info', 'exc_text', 'stack_info',
                          'lineno', 'funcName', 'created', 'msecs', 'relativeCreated',
                          'thread', 'threadName', 'processName', 'process', 'message']:
                if not key.startswith('_') and isinstance(value, (str, int, float, bool, type(None))):
                    log_entry[key] = value
        
        return json.dumps(log_entry, default=str)

def setup_logging(log_level: str = 'INFO', service_name: str = 'audio-processing') -> logging.Logger:
    """
    Set up comprehensive logging configuration for the audio processing service.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        service_name: Name of the service for log identification
        
    Returns:
        Configured root logger
    """
    
    # Convert string level to logging constant
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)
    
    # Clear any existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create console handler with structured formatting
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(numeric_level)
    
    # Use structured JSON format for container environments
    if os.environ.get('AWS_EXECUTION_ENV'):
        # Running in AWS environment - use CloudWatch-friendly JSON format
        formatter = CloudWatchFormatter()
    else:
        # Local development - use human-readable format
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # Configure specific loggers
    loggers_config = {
        'boto3': logging.WARNING,
        'botocore': logging.WARNING,
        'urllib3': logging.WARNING,
        'pydub': logging.INFO,
        's3transfer': logging.WARNING
    }
    
    for logger_name, level in loggers_config.items():
        logger = logging.getLogger(logger_name)
        logger.setLevel(level)
    
    # Log initialization
    logger = logging.getLogger(service_name)
    logger.info("Logging system initialized", extra={
        'log_level': log_level,
        'service_name': service_name,
        'aws_execution_env': os.environ.get('AWS_EXECUTION_ENV', 'local'),
        'python_version': sys.version
    })
    
    return logger

class LoggingContext:
    """
    Context manager for adding consistent context to log messages.
    """
    
    def __init__(self, logger: logging.Logger, **context):
        """
        Initialize logging context.
        
        Args:
            logger: Logger instance to use
            **context: Key-value pairs to add to all log messages
        """
        self.logger = logger
        self.context = context
        self.old_factory = logging.getLogRecordFactory()
        
    def __enter__(self):
        """Set up the logging context."""
        def record_factory(*args, **kwargs):
            record = self.old_factory(*args, **kwargs)
            for key, value in self.context.items():
                setattr(record, key, value)
            return record
        
        logging.setLogRecordFactory(record_factory)
        return self.logger
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Clean up the logging context."""
        logging.setLogRecordFactory(self.old_factory)

def log_performance_metrics(logger: logging.Logger, operation: str, 
                          processing_time: float, file_size: int, 
                          memory_usage: Optional[float] = None, **kwargs):
    """
    Log performance metrics for monitoring and optimization.
    
    Args:
        logger: Logger instance
        operation: Name of the operation being measured
        processing_time: Time taken in seconds
        file_size: File size in bytes
        memory_usage: Memory usage in MB (optional)
        **kwargs: Additional metrics to log
    """
    metrics = {
        'operation': operation,
        'processing_time': round(processing_time, 3),
        'file_size': file_size,
        'throughput_mbps': round((file_size / (1024 * 1024)) / processing_time, 3) if processing_time > 0 else 0
    }
    
    if memory_usage is not None:
        metrics['memory_usage'] = round(memory_usage, 2)
    
    metrics.update(kwargs)
    
    logger.info(f"Performance metrics for {operation}", extra=metrics)

def log_error_with_context(logger: logging.Logger, error: Exception, 
                          context: Dict[str, Any], operation: str = None):
    """
    Log errors with comprehensive context for debugging.
    
    Args:
        logger: Logger instance
        error: Exception that occurred
        context: Dictionary of context information
        operation: Operation that failed (optional)
    """
    error_details = {
        'error_type': type(error).__name__,
        'error_message': str(error),
        'operation': operation or 'unknown'
    }
    
    # Add context information
    error_details.update(context)
    
    logger.error(f"Operation failed: {operation or 'unknown'}", 
                extra=error_details, exc_info=True)

def create_session_logger(base_logger: logging.Logger, session_id: str, 
                         user_id: str = None, s3_key: str = None) -> logging.Logger:
    """
    Create a logger with session context for tracking processing workflows.
    
    Args:
        base_logger: Base logger to extend
        session_id: Unique session identifier
        user_id: User identifier (optional)
        s3_key: S3 key being processed (optional)
        
    Returns:
        Logger with session context
    """
    class SessionAdapter(logging.LoggerAdapter):
        def process(self, msg, kwargs):
            kwargs.setdefault('extra', {})
            kwargs['extra']['session_id'] = session_id
            if user_id:
                kwargs['extra']['user_id'] = user_id
            if s3_key:
                kwargs['extra']['s3_key'] = s3_key
            return msg, kwargs
    
    return SessionAdapter(base_logger, {})
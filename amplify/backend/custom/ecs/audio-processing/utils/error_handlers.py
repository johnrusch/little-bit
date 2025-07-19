#!/usr/bin/env python3
"""
Error Handling Utilities for Little Bit Audio Processing Service
Provides comprehensive error handling, retry logic, and recovery mechanisms.
"""

import time
import logging
import traceback
import functools
from typing import Callable, Any, Optional, Dict, Union, Type
from enum import Enum

logger = logging.getLogger(__name__)

class ErrorCategory(Enum):
    """Categories of errors for better error handling and monitoring."""
    CONFIGURATION = "configuration"
    NETWORK = "network" 
    STORAGE = "storage"
    AUDIO_PROCESSING = "audio_processing"
    VALIDATION = "validation"
    RESOURCE = "resource"
    UNKNOWN = "unknown"

class ProcessingError(Exception):
    """Base exception for audio processing errors."""
    
    def __init__(self, message: str, category: ErrorCategory = ErrorCategory.UNKNOWN, 
                 details: Optional[Dict[str, Any]] = None, recoverable: bool = True):
        super().__init__(message)
        self.category = category
        self.details = details or {}
        self.recoverable = recoverable
        self.timestamp = time.time()

class ConfigurationError(ProcessingError):
    """Error in configuration or environment setup."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, ErrorCategory.CONFIGURATION, details, recoverable=False)

class NetworkError(ProcessingError):
    """Network-related errors (S3, API calls, etc.)."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, ErrorCategory.NETWORK, details, recoverable=True)

class StorageError(ProcessingError):
    """Storage-related errors (file I/O, S3, etc.)."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, ErrorCategory.STORAGE, details, recoverable=True)

class AudioProcessingError(ProcessingError):
    """Audio processing specific errors."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None, recoverable: bool = True):
        super().__init__(message, ErrorCategory.AUDIO_PROCESSING, details, recoverable)

class ValidationError(ProcessingError):
    """Input validation errors."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, ErrorCategory.VALIDATION, details, recoverable=False)

class ResourceError(ProcessingError):
    """Resource constraint errors (memory, disk, CPU)."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, ErrorCategory.RESOURCE, details, recoverable=False)

def retry_with_exponential_backoff(max_retries: int = 3, base_delay: float = 1.0, 
                                 max_delay: float = 60.0, 
                                 exceptions: tuple = (Exception,),
                                 retry_on_category: Optional[ErrorCategory] = None):
    """
    Decorator for retrying functions with exponential backoff.
    
    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Base delay between retries in seconds
        max_delay: Maximum delay between retries in seconds
        exceptions: Tuple of exception types to retry on
        retry_on_category: Only retry on specific error categories
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    
                    # Check if this is a ProcessingError with non-recoverable category
                    if isinstance(e, ProcessingError):
                        if not e.recoverable:
                            logger.error(f"Non-recoverable error in {func.__name__}: {str(e)}")
                            raise
                        
                        if retry_on_category and e.category != retry_on_category:
                            logger.error(f"Error category {e.category} not in retry list for {func.__name__}")
                            raise
                    
                    if attempt == max_retries:
                        logger.error(f"Function {func.__name__} failed after {max_retries + 1} attempts")
                        break
                    
                    # Calculate delay with exponential backoff
                    delay = min(base_delay * (2 ** attempt), max_delay)
                    
                    logger.warning(f"Attempt {attempt + 1} failed for {func.__name__}: {str(e)}. "
                                 f"Retrying in {delay:.2f} seconds...")
                    
                    time.sleep(delay)
            
            # If we get here, all retries failed
            raise last_exception
        
        return wrapper
    return decorator

def handle_processing_error(error: Exception, context: Dict[str, Any], 
                          operation: str = None) -> ProcessingError:
    """
    Convert generic exceptions to categorized ProcessingErrors with context.
    
    Args:
        error: The original exception
        context: Context information for debugging
        operation: Name of the operation that failed
        
    Returns:
        ProcessingError with appropriate category and context
    """
    error_message = str(error)
    error_type = type(error).__name__
    
    # Categorize common errors
    if 'credential' in error_message.lower() or 'permission' in error_message.lower():
        return ConfigurationError(
            f"Authentication/authorization error in {operation}: {error_message}",
            details={**context, 'original_error': error_type, 'operation': operation}
        )
    
    elif 'network' in error_message.lower() or 'timeout' in error_message.lower():
        return NetworkError(
            f"Network error in {operation}: {error_message}",
            details={**context, 'original_error': error_type, 'operation': operation}
        )
    
    elif 'file' in error_message.lower() or 's3' in error_message.lower():
        return StorageError(
            f"Storage error in {operation}: {error_message}",
            details={**context, 'original_error': error_type, 'operation': operation}
        )
    
    elif 'memory' in error_message.lower() or 'resource' in error_message.lower():
        return ResourceError(
            f"Resource error in {operation}: {error_message}",
            details={**context, 'original_error': error_type, 'operation': operation}
        )
    
    elif any(audio_term in error_message.lower() for audio_term in ['audio', 'codec', 'format', 'pydub']):
        return AudioProcessingError(
            f"Audio processing error in {operation}: {error_message}",
            details={**context, 'original_error': error_type, 'operation': operation}
        )
    
    else:
        return ProcessingError(
            f"Unknown error in {operation}: {error_message}",
            category=ErrorCategory.UNKNOWN,
            details={**context, 'original_error': error_type, 'operation': operation}
        )

def safe_execute(func: Callable, context: Dict[str, Any], 
                operation: str = None, default_return: Any = None) -> Any:
    """
    Safely execute a function with comprehensive error handling.
    
    Args:
        func: Function to execute
        context: Context information for error reporting
        operation: Name of the operation for logging
        default_return: Default value to return on error
        
    Returns:
        Function result or default_return on error
    """
    try:
        return func()
    except ProcessingError:
        # Re-raise ProcessingErrors without modification
        raise
    except Exception as e:
        # Convert to ProcessingError
        processing_error = handle_processing_error(e, context, operation)
        logger.error(f"Safe execution failed for {operation}", 
                    extra={'context': context, 'error': str(e)}, exc_info=True)
        
        if default_return is not None:
            logger.warning(f"Returning default value for {operation}: {default_return}")
            return default_return
        
        raise processing_error

class ErrorRecovery:
    """Helper class for error recovery strategies."""
    
    @staticmethod
    def cleanup_temp_files(file_paths: list) -> None:
        """Clean up temporary files on error."""
        import os
        for file_path in file_paths:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.info(f"Cleaned up temporary file: {file_path}")
            except Exception as e:
                logger.warning(f"Failed to clean up {file_path}: {str(e)}")
    
    @staticmethod
    def check_disk_space(required_mb: int = 100) -> bool:
        """Check if sufficient disk space is available."""
        import shutil
        try:
            total, used, free = shutil.disk_usage('/tmp')
            free_mb = free // (1024 * 1024)
            
            if free_mb < required_mb:
                logger.error(f"Insufficient disk space: {free_mb}MB available, {required_mb}MB required")
                return False
            
            logger.info(f"Disk space check passed: {free_mb}MB available")
            return True
        except Exception as e:
            logger.error(f"Failed to check disk space: {str(e)}")
            return False
    
    @staticmethod
    def validate_environment() -> None:
        """Validate required environment variables and configurations."""
        import os
        
        required_vars = [
            'S3_BUCKET',
            'S3_KEY',
            'USER_ID',
            'AWS_DEFAULT_REGION'
        ]
        
        missing_vars = []
        for var in required_vars:
            if not os.environ.get(var):
                missing_vars.append(var)
        
        if missing_vars:
            raise ConfigurationError(
                f"Missing required environment variables: {', '.join(missing_vars)}",
                details={'missing_variables': missing_vars}
            )
        
        logger.info("Environment validation passed")

def create_error_response(error: ProcessingError, session_id: str = None) -> Dict[str, Any]:
    """
    Create a standardized error response for the processing service.
    
    Args:
        error: ProcessingError instance
        session_id: Optional session identifier
        
    Returns:
        Standardized error response dictionary
    """
    response = {
        'statusCode': 500 if error.recoverable else 400,
        'error': {
            'message': str(error),
            'category': error.category.value,
            'recoverable': error.recoverable,
            'timestamp': error.timestamp,
            'details': error.details
        }
    }
    
    if session_id:
        response['sessionId'] = session_id
    
    return response

def log_error_metrics(error: ProcessingError, logger: logging.Logger, 
                     session_id: str = None, operation: str = None):
    """
    Log error metrics for monitoring and alerting.
    
    Args:
        error: ProcessingError instance
        logger: Logger instance
        session_id: Optional session identifier
        operation: Operation that failed
    """
    metrics = {
        'error_category': error.category.value,
        'error_type': type(error).__name__,
        'recoverable': error.recoverable,
        'operation': operation or 'unknown'
    }
    
    if session_id:
        metrics['session_id'] = session_id
    
    logger.error("Processing error occurred", extra=metrics, exc_info=True)
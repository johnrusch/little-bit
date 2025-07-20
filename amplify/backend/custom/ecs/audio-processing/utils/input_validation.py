#!/usr/bin/env python3
"""
Input Validation Utilities for Little Bit Audio Processing Service
Provides comprehensive validation for user inputs and parameters.
"""

import re
import logging
from typing import Any, Dict, Optional
from urllib.parse import unquote

from .error_handlers import ValidationError

logger = logging.getLogger(__name__)

class InputValidator:
    """
    Comprehensive input validation for audio processing service.
    """
    
    # Regex patterns for validation
    USER_ID_PATTERN = re.compile(r'^[a-zA-Z0-9_-]{1,64}$')
    S3_KEY_PATTERN = re.compile(r'^[a-zA-Z0-9._/-]{1,1024}$')
    FILENAME_PATTERN = re.compile(r'^[a-zA-Z0-9._-]{1,255}$')
    BUCKET_NAME_PATTERN = re.compile(r'^[a-z0-9.-]{3,63}$')
    
    # Allowed audio file extensions
    ALLOWED_AUDIO_EXTENSIONS = {'.m4a', '.wav', '.mp3', '.aac', '.flac'}
    
    @staticmethod
    def validate_user_id(user_id: Any) -> str:
        """
        Validate user ID format and security.
        
        Args:
            user_id: User identifier to validate
            
        Returns:
            Validated user ID string
            
        Raises:
            ValidationError: If user ID is invalid
        """
        if not isinstance(user_id, str):
            raise ValidationError(f"User ID must be a string, got {type(user_id).__name__}")
        
        if not user_id:
            raise ValidationError("User ID cannot be empty")
        
        # Check length limits
        if len(user_id) > 64:
            raise ValidationError(f"User ID too long: {len(user_id)} characters (max 64)")
        
        # Check format - alphanumeric, underscore, hyphen only
        if not InputValidator.USER_ID_PATTERN.match(user_id):
            raise ValidationError(
                f"User ID contains invalid characters: {user_id[:20]}... "
                "(allowed: letters, numbers, underscore, hyphen)"
            )
        
        # Security checks
        if '..' in user_id or user_id.startswith('.') or user_id.endswith('.'):
            raise ValidationError("User ID cannot contain path traversal sequences")
        
        logger.debug(f"User ID validation passed: {user_id}")
        return user_id
    
    @staticmethod
    def validate_s3_key(s3_key: Any) -> str:
        """
        Validate S3 key format and security.
        
        Args:
            s3_key: S3 key to validate
            
        Returns:
            Validated S3 key string
            
        Raises:
            ValidationError: If S3 key is invalid
        """
        if not isinstance(s3_key, str):
            raise ValidationError(f"S3 key must be a string, got {type(s3_key).__name__}")
        
        if not s3_key:
            raise ValidationError("S3 key cannot be empty")
        
        # URL decode to check for encoded traversal attempts
        decoded_key = unquote(s3_key)
        
        # Check length limits
        if len(s3_key) > 1024:
            raise ValidationError(f"S3 key too long: {len(s3_key)} characters (max 1024)")
        
        # Security validation against path traversal
        normalized_key = decoded_key.replace('\\', '/').strip('/')
        if (
            '..' in normalized_key or
            normalized_key.startswith('../') or
            '/..' in normalized_key or
            '%2e%2e' in s3_key.lower() or
            '%2f' in s3_key.lower() or
            '//' in normalized_key
        ):
            raise ValidationError(f"S3 key contains path traversal sequences: {s3_key[:50]}...")
        
        # Check for valid characters (more restrictive than AWS allows for security)
        if not InputValidator.S3_KEY_PATTERN.match(s3_key):
            raise ValidationError(
                f"S3 key contains invalid characters: {s3_key[:50]}... "
                "(allowed: letters, numbers, dot, underscore, hyphen, forward slash)"
            )
        
        logger.debug(f"S3 key validation passed: {s3_key}")
        return s3_key
    
    @staticmethod
    def validate_bucket_name(bucket_name: Any) -> str:
        """
        Validate S3 bucket name format.
        
        Args:
            bucket_name: S3 bucket name to validate
            
        Returns:
            Validated bucket name string
            
        Raises:
            ValidationError: If bucket name is invalid
        """
        if not isinstance(bucket_name, str):
            raise ValidationError(f"Bucket name must be a string, got {type(bucket_name).__name__}")
        
        if not bucket_name:
            raise ValidationError("Bucket name cannot be empty")
        
        # Check length (AWS requirement: 3-63 characters)
        if len(bucket_name) < 3 or len(bucket_name) > 63:
            raise ValidationError(f"Bucket name length invalid: {len(bucket_name)} (must be 3-63 characters)")
        
        # Check format (AWS requirement: lowercase letters, numbers, dots, hyphens)
        if not InputValidator.BUCKET_NAME_PATTERN.match(bucket_name):
            raise ValidationError(
                f"Bucket name contains invalid characters: {bucket_name} "
                "(allowed: lowercase letters, numbers, dots, hyphens)"
            )
        
        # Additional AWS requirements
        if bucket_name.startswith('.') or bucket_name.endswith('.'):
            raise ValidationError("Bucket name cannot start or end with a dot")
        
        if bucket_name.startswith('-') or bucket_name.endswith('-'):
            raise ValidationError("Bucket name cannot start or end with a hyphen")
        
        if '..' in bucket_name:
            raise ValidationError("Bucket name cannot contain consecutive dots")
        
        logger.debug(f"Bucket name validation passed: {bucket_name}")
        return bucket_name
    
    @staticmethod
    def validate_filename(filename: Any) -> str:
        """
        Validate filename format and security.
        
        Args:
            filename: Filename to validate
            
        Returns:
            Validated filename string
            
        Raises:
            ValidationError: If filename is invalid
        """
        if not isinstance(filename, str):
            raise ValidationError(f"Filename must be a string, got {type(filename).__name__}")
        
        if not filename:
            raise ValidationError("Filename cannot be empty")
        
        # Check length limits
        if len(filename) > 255:
            raise ValidationError(f"Filename too long: {len(filename)} characters (max 255)")
        
        # Check for path traversal and invalid characters
        if (
            '..' in filename or
            '/' in filename or
            '\\' in filename or
            filename.startswith('.') or
            any(ord(c) < 32 for c in filename)  # Control characters
        ):
            raise ValidationError(f"Filename contains invalid characters: {filename[:50]}...")
        
        # Check format - alphanumeric, dot, underscore, hyphen only
        if not InputValidator.FILENAME_PATTERN.match(filename):
            raise ValidationError(
                f"Filename contains invalid characters: {filename[:50]}... "
                "(allowed: letters, numbers, dot, underscore, hyphen)"
            )
        
        logger.debug(f"Filename validation passed: {filename}")
        return filename
    
    @staticmethod
    def validate_audio_filename(filename: str) -> str:
        """
        Validate audio filename with extension check.
        
        Args:
            filename: Audio filename to validate
            
        Returns:
            Validated filename string
            
        Raises:
            ValidationError: If filename is invalid or has unsupported extension
        """
        # First validate as regular filename
        validated_filename = InputValidator.validate_filename(filename)
        
        # Check for audio file extension
        filename_lower = validated_filename.lower()
        if not any(filename_lower.endswith(ext) for ext in InputValidator.ALLOWED_AUDIO_EXTENSIONS):
            raise ValidationError(
                f"Unsupported audio file extension: {filename} "
                f"(supported: {', '.join(InputValidator.ALLOWED_AUDIO_EXTENSIONS)})"
            )
        
        logger.debug(f"Audio filename validation passed: {filename}")
        return validated_filename
    
    @staticmethod
    def validate_processing_parameters(params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate audio processing parameters.
        
        Args:
            params: Processing parameters dictionary
            
        Returns:
            Validated parameters dictionary
            
        Raises:
            ValidationError: If parameters are invalid
        """
        validated_params = {}
        
        # Define parameter validation rules
        param_rules = {
            'silenceThreshold': {
                'type': (int, float),
                'min': -50,
                'max': -20,
                'default': -30
            },
            'minSilenceDuration': {
                'type': int,
                'min': 500,
                'max': 2000,
                'default': 750
            },
            'keepSilence': {
                'type': int,
                'min': 0,
                'max': 500,
                'default': 50
            },
            'targetDbfs': {
                'type': (int, float),
                'min': -30.0,
                'max': -10.0,
                'default': -20.0
            },
            'createOneShot': {
                'type': bool,
                'default': True
            },
            'normalizeAudio': {
                'type': bool,
                'default': True
            },
            'preserveOriginal': {
                'type': bool,
                'default': True
            },
            'outputFormat': {
                'type': str,
                'allowed': ['original', 'wav', 'mp3', 'm4a', 'aac', 'flac'],
                'default': 'original'
            }
        }
        
        for param_name, value in params.items():
            if param_name not in param_rules:
                logger.warning(f"Unknown parameter ignored: {param_name}")
                continue
            
            rule = param_rules[param_name]
            
            # Type validation
            if not isinstance(value, rule['type']):
                raise ValidationError(
                    f"Parameter {param_name} must be {rule['type']}, got {type(value).__name__}"
                )
            
            # Range validation
            if 'min' in rule and value < rule['min']:
                raise ValidationError(f"Parameter {param_name} below minimum: {value} < {rule['min']}")
            
            if 'max' in rule and value > rule['max']:
                raise ValidationError(f"Parameter {param_name} above maximum: {value} > {rule['max']}")
            
            # Allowed values validation
            if 'allowed' in rule and value not in rule['allowed']:
                raise ValidationError(
                    f"Parameter {param_name} invalid value: {value} "
                    f"(allowed: {rule['allowed']})"
                )
            
            validated_params[param_name] = value
        
        logger.debug(f"Processing parameters validation passed: {len(validated_params)} parameters")
        return validated_params
    
    @staticmethod
    def validate_environment_variables() -> Dict[str, str]:
        """
        Validate required environment variables.
        
        Returns:
            Dictionary of validated environment variables
            
        Raises:
            ValidationError: If required variables are missing or invalid
        """
        import os
        
        required_vars = ['S3_BUCKET', 'S3_KEY', 'USER_ID', 'AWS_DEFAULT_REGION']
        validated_env = {}
        
        for var_name in required_vars:
            value = os.environ.get(var_name)
            if not value:
                raise ValidationError(f"Required environment variable missing: {var_name}")
            
            # Validate specific variables
            if var_name == 'S3_BUCKET':
                validated_env[var_name] = InputValidator.validate_bucket_name(value)
            elif var_name == 'S3_KEY':
                validated_env[var_name] = InputValidator.validate_s3_key(value)
            elif var_name == 'USER_ID':
                validated_env[var_name] = InputValidator.validate_user_id(value)
            elif var_name == 'AWS_DEFAULT_REGION':
                # Basic AWS region validation
                if not re.match(r'^[a-z0-9-]+$', value) or len(value) > 20:
                    raise ValidationError(f"Invalid AWS region format: {value}")
                validated_env[var_name] = value
            else:
                validated_env[var_name] = value
        
        logger.info("Environment variables validation passed")
        return validated_env
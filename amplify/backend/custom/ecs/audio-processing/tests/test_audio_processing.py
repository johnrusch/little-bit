#!/usr/bin/env python3
"""
Unit tests for audio processing functionality.
"""

import os
import sys
import unittest
import tempfile
import shutil
from unittest.mock import Mock, patch, MagicMock
import json

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from utils.audio_utils import AudioProcessor, AudioProcessingConfig, create_processing_config
    from utils.error_handlers import AudioProcessingError, ValidationError
    from audio_processor import AudioProcessingService
except ImportError as e:
    print(f"Import error in tests: {e}")
    sys.exit(1)

class TestAudioProcessingConfig(unittest.TestCase):
    """Test audio processing configuration."""
    
    def test_default_config(self):
        """Test default configuration values."""
        config = AudioProcessingConfig()
        
        self.assertEqual(config.silence_threshold, -30)
        self.assertEqual(config.min_silence_duration, 750)
        self.assertEqual(config.keep_silence, 50)
        self.assertTrue(config.create_one_shot)
        self.assertTrue(config.normalize_audio)
        self.assertEqual(config.target_dbfs, -20.0)
    
    def test_custom_config(self):
        """Test custom configuration values."""
        custom_config = {
            'silenceThreshold': -25,
            'minSilenceDuration': 1000,
            'createOneShot': False,
            'normalizeAudio': False
        }
        
        config = AudioProcessingConfig(custom_config)
        
        self.assertEqual(config.silence_threshold, -25)
        self.assertEqual(config.min_silence_duration, 1000)
        self.assertFalse(config.create_one_shot)
        self.assertFalse(config.normalize_audio)
    
    def test_invalid_config_values(self):
        """Test configuration with invalid values."""
        invalid_config = {
            'silenceThreshold': -100,  # Too low
            'minSilenceDuration': 5000,  # Too high
            'targetDbfs': 'invalid'  # Wrong type
        }
        
        config = AudioProcessingConfig(invalid_config)
        
        # Should use defaults or reasonable values
        self.assertGreaterEqual(config.silence_threshold, -50)
        self.assertLessEqual(config.min_silence_duration, 2000)
        self.assertIsInstance(config.target_dbfs, float)
    
    def test_config_from_env(self):
        """Test configuration creation from environment variables."""
        env_vars = {
            'PROCESSING_PARAMS': json.dumps({
                'silenceThreshold': -28,
                'createOneShot': True
            }),
            'PRESERVE_ORIGINAL': 'false',
            'OUTPUT_FORMAT': 'wav'
        }
        
        config = create_processing_config(env_vars)
        
        self.assertEqual(config.silence_threshold, -28)
        self.assertTrue(config.create_one_shot)
        self.assertFalse(config.preserve_original)
        self.assertEqual(config.output_format, 'wav')

class TestAudioProcessor(unittest.TestCase):
    """Test audio processor functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.config = AudioProcessingConfig()
        self.processor = AudioProcessor(self.config)
        self.temp_dir = tempfile.mkdtemp()
    
    def tearDown(self):
        """Clean up test fixtures."""
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
    
    @patch('utils.audio_utils.AudioSegment')
    def test_analyze_audio(self, mock_audio_segment):
        """Test audio analysis functionality."""
        # Mock audio segment
        mock_audio = Mock()
        mock_audio.duration_seconds = 10.5
        mock_audio.channels = 2
        mock_audio.frame_rate = 44100
        mock_audio.sample_width = 2
        mock_audio.max_dBFS = -3.2
        mock_audio.dBFS = -12.4
        mock_audio.rms = 1000
        mock_audio.__len__ = Mock(return_value=10500)  # 10.5 seconds in ms
        
        analysis = self.processor.analyze_audio(mock_audio)
        
        self.assertEqual(analysis['duration_seconds'], 10.5)
        self.assertEqual(analysis['channels'], 2)
        self.assertEqual(analysis['frame_rate'], 44100)
        self.assertEqual(analysis['max_dbfs'], -3.2)
        self.assertEqual(analysis['dbfs'], -12.4)
    
    def test_get_output_format(self):
        """Test output format determination."""
        analysis = {'original_format': 'm4a'}
        
        # Test original format preservation
        self.config.output_format = 'original'
        format_str = self.processor._get_output_format(analysis)
        self.assertEqual(format_str, 'wav')  # Default safe format
        
        # Test specific format
        self.config.output_format = 'mp3'
        format_str = self.processor._get_output_format(analysis)
        self.assertEqual(format_str, 'mp3')
        
        # Test invalid format
        self.config.output_format = 'invalid'
        format_str = self.processor._get_output_format(analysis)
        self.assertEqual(format_str, 'wav')  # Fallback to safe default
    
    def test_process_audio_file_validation(self):
        """Test input validation for audio file processing."""
        # Test non-existent file
        with self.assertRaises(ValidationError):
            self.processor.process_audio_file(
                '/nonexistent/file.wav', self.temp_dir, 'test'
            )

class TestAudioProcessingService(unittest.TestCase):
    """Test the main audio processing service."""
    
    def setUp(self):
        """Set up test environment."""
        self.service = AudioProcessingService(session_id='test-session')
        
        # Mock environment variables
        self.env_patcher = patch.dict(os.environ, {
            'S3_BUCKET': 'test-bucket',
            'S3_KEY': 'public/unprocessed/user123/test.m4a',
            'USER_ID': 'user123',
            'AWS_DEFAULT_REGION': 'us-east-1',
            'PROCESSING_PARAMS': json.dumps({'silenceThreshold': -30})
        })
        self.env_patcher.start()
    
    def tearDown(self):
        """Clean up test environment."""
        self.env_patcher.stop()
    
    @patch('audio_processor.S3Operations')
    @patch('audio_processor.AudioProcessor')
    @patch('audio_processor.ErrorRecovery')
    def test_initialize_success(self, mock_recovery, mock_processor_class, mock_s3_class):
        """Test successful service initialization."""
        # Mock dependencies
        mock_recovery.validate_environment.return_value = None
        mock_recovery.check_disk_space.return_value = True
        mock_s3_class.return_value = Mock()
        mock_processor_class.return_value = Mock()
        
        # Should not raise an exception
        self.service.initialize()
        
        # Verify initialization calls
        mock_recovery.validate_environment.assert_called_once()
        mock_recovery.check_disk_space.assert_called_once_with(100)
        mock_s3_class.assert_called_once_with(region_name='us-east-1')
    
    @patch('audio_processor.ErrorRecovery')
    def test_initialize_disk_space_error(self, mock_recovery):
        """Test initialization failure due to insufficient disk space."""
        mock_recovery.validate_environment.return_value = None
        mock_recovery.check_disk_space.return_value = False
        
        with self.assertRaises(Exception):
            self.service.initialize()
    
    @patch('tempfile.mkdtemp')
    @patch('os.path.getsize')
    def test_download_validation(self, mock_getsize, mock_mkdtemp):
        """Test download file validation."""
        mock_mkdtemp.return_value = '/tmp/test'
        
        # Mock S3 operations
        mock_s3 = Mock()
        mock_s3.download_file.return_value = True
        self.service.s3_ops = mock_s3
        
        # Test empty file validation
        mock_getsize.return_value = 0
        with self.assertRaises(Exception):
            self.service.download_source_file('bucket', 'key')
        
        # Test file too large validation
        mock_getsize.return_value = 200 * 1024 * 1024  # 200MB
        with self.assertRaises(Exception):
            self.service.download_source_file('bucket', 'key')
    
    def test_cleanup(self):
        """Test cleanup functionality."""
        # Add some mock temp files
        self.service.temp_files = ['/tmp/test1', '/tmp/test2']
        
        with patch('utils.error_handlers.ErrorRecovery.cleanup_temp_files') as mock_cleanup:
            self.service.cleanup()
            mock_cleanup.assert_called_once_with(['/tmp/test1', '/tmp/test2'])
            self.assertEqual(len(self.service.temp_files), 0)

class TestErrorHandling(unittest.TestCase):
    """Test error handling and recovery mechanisms."""
    
    def test_processing_error_categories(self):
        """Test different error categories."""
        from utils.error_handlers import (
            AudioProcessingError, ValidationError, NetworkError, 
            StorageError, ConfigurationError, ResourceError
        )
        
        # Test different error types
        audio_error = AudioProcessingError("Audio processing failed")
        self.assertEqual(audio_error.category.value, "audio_processing")
        self.assertTrue(audio_error.recoverable)
        
        validation_error = ValidationError("Invalid input")
        self.assertEqual(validation_error.category.value, "validation")
        self.assertFalse(validation_error.recoverable)
        
        config_error = ConfigurationError("Missing config")
        self.assertEqual(config_error.category.value, "configuration")
        self.assertFalse(config_error.recoverable)

if __name__ == '__main__':
    # Set up logging to suppress output during tests
    import logging
    logging.getLogger().setLevel(logging.CRITICAL)
    
    unittest.main(verbosity=2)
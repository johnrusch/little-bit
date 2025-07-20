#!/usr/bin/env python3
"""
Deployment Validation Script for ECS Audio Processing Container
Tests critical functionality and integration points before deployment.
"""

import os
import sys
import json
import tempfile
import unittest
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test that all critical modules can be imported."""
    print("🔍 Testing Module Imports...")
    
    try:
        # Test core imports
        import audio_processor
        import s3_operations
        from utils import input_validation, error_handlers, logging_config, audio_utils
        print("✅ All core modules imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def test_input_validation():
    """Test the new input validation functionality."""
    print("\n🔍 Testing Input Validation...")
    
    try:
        from utils.input_validation import InputValidator
        
        # Test valid user ID
        valid_user = InputValidator.validate_user_id("user123")
        assert valid_user == "user123"
        print("✅ Valid user ID validation passed")
        
        # Test invalid user ID (should raise exception)
        try:
            InputValidator.validate_user_id("../malicious")
            print("❌ Path traversal in user ID not detected")
            return False
        except Exception:
            print("✅ Path traversal in user ID correctly rejected")
        
        # Test S3 key validation
        valid_key = InputValidator.validate_s3_key("public/unprocessed/user123/audio.m4a")
        print("✅ Valid S3 key validation passed")
        
        # Test invalid S3 key
        try:
            InputValidator.validate_s3_key("../../../etc/passwd")
            print("❌ Path traversal in S3 key not detected")
            return False
        except Exception:
            print("✅ Path traversal in S3 key correctly rejected")
        
        # Test URL-encoded traversal
        try:
            InputValidator.validate_s3_key("public%2e%2e/malicious")
            print("❌ URL-encoded path traversal not detected")
            return False
        except Exception:
            print("✅ URL-encoded path traversal correctly rejected")
        
        # Test audio filename validation
        valid_audio = InputValidator.validate_audio_filename("recording.m4a")
        assert valid_audio == "recording.m4a"
        print("✅ Valid audio filename validation passed")
        
        # Test invalid audio extension
        try:
            InputValidator.validate_audio_filename("malicious.exe")
            print("❌ Invalid audio extension not detected")
            return False
        except Exception:
            print("✅ Invalid audio extension correctly rejected")
        
        print("✅ All input validation tests passed")
        return True
        
    except Exception as e:
        print(f"❌ Input validation test failed: {e}")
        return False

def test_environment_validation():
    """Test environment variable validation."""
    print("\n🔍 Testing Environment Validation...")
    
    try:
        from utils.input_validation import InputValidator
        
        # Test with valid environment
        test_env = {
            'S3_BUCKET': 'little-bit-storage',
            'S3_KEY': 'public/unprocessed/user123/test.m4a',
            'USER_ID': 'user123',
            'AWS_DEFAULT_REGION': 'us-east-1'
        }
        
        with patch.dict(os.environ, test_env):
            validated = InputValidator.validate_environment_variables()
            assert all(key in validated for key in test_env.keys())
            print("✅ Valid environment validation passed")
        
        # Test with missing variables
        with patch.dict(os.environ, {}, clear=True):
            try:
                InputValidator.validate_environment_variables()
                print("❌ Missing environment variables not detected")
                return False
            except Exception:
                print("✅ Missing environment variables correctly detected")
        
        # Test with invalid values
        invalid_env = {
            'S3_BUCKET': 'INVALID-BUCKET-NAME!',
            'S3_KEY': '../../../malicious',
            'USER_ID': 'user/../admin',
            'AWS_DEFAULT_REGION': 'invalid-region-format!'
        }
        
        with patch.dict(os.environ, invalid_env):
            try:
                InputValidator.validate_environment_variables()
                print("❌ Invalid environment values not detected")
                return False
            except Exception:
                print("✅ Invalid environment values correctly rejected")
        
        print("✅ All environment validation tests passed")
        return True
        
    except Exception as e:
        print(f"❌ Environment validation test failed: {e}")
        return False

def test_s3_security_enhancements():
    """Test S3 operations security enhancements."""
    print("\n🔍 Testing S3 Security Enhancements...")
    
    try:
        from s3_operations import S3Operations
        
        # Create mock S3 operations
        with patch('boto3.client'):
            s3_ops = S3Operations()
            s3_ops.s3_client = Mock()
            
            # Test path traversal protection in download
            try:
                s3_ops.download_file('bucket', '../../../etc/passwd', '/tmp/test')
                print("❌ Path traversal in download not detected")
                return False
            except Exception:
                print("✅ Path traversal in download correctly blocked")
            
            # Test path traversal protection in upload
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_file.write(b'test data')
                temp_path = temp_file.name
            
            try:
                try:
                    s3_ops.upload_file(temp_path, 'bucket', '../../../malicious')
                    print("❌ Path traversal in upload not detected")
                    return False
                except Exception:
                    print("✅ Path traversal in upload correctly blocked")
            finally:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
            
            # Test metadata sanitization
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_file.write(b'test data')
                temp_path = temp_file.name
            
            try:
                # Mock successful upload for metadata test
                s3_ops.s3_client.upload_file.return_value = None
                s3_ops.s3_client.head_object.return_value = {'ContentLength': 9}
                
                malicious_metadata = {
                    'evil<script>': 'alert("xss")',
                    'normal-key': 'normal-value',
                    'path/../traversal': 'bad-value'
                }
                
                # This should not raise an exception but should sanitize the metadata
                result = s3_ops.upload_file(temp_path, 'bucket', 'valid/key', metadata=malicious_metadata)
                
                # Check that upload was called with sanitized metadata
                call_args = s3_ops.s3_client.upload_file.call_args
                if call_args:
                    extra_args = call_args[1].get('ExtraArgs', {})
                    sanitized_metadata = extra_args.get('Metadata', {})
                    
                    # Should not contain the malicious keys
                    if any('script' in key or 'traversal' in key for key in sanitized_metadata.keys()):
                        print("❌ Metadata sanitization failed")
                        return False
                    else:
                        print("✅ Metadata sanitization working correctly")
                
            finally:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
        
        print("✅ All S3 security enhancement tests passed")
        return True
        
    except Exception as e:
        print(f"❌ S3 security test failed: {e}")
        return False

def test_error_handling():
    """Test enhanced error handling and recovery."""
    print("\n🔍 Testing Error Handling...")
    
    try:
        from utils.error_handlers import (
            ProcessingError, ValidationError, NetworkError, 
            retry_with_exponential_backoff, ErrorRecovery
        )
        
        # Test error categorization
        validation_error = ValidationError("Invalid input")
        assert validation_error.category.value == "validation"
        assert not validation_error.recoverable
        print("✅ Error categorization working correctly")
        
        # Test retry decorator
        attempt_count = 0
        
        @retry_with_exponential_backoff(max_retries=2, base_delay=0.01)
        def failing_function():
            nonlocal attempt_count
            attempt_count += 1
            if attempt_count < 3:
                raise NetworkError("Network failure")
            return "success"
        
        with patch('time.sleep'):  # Speed up test
            result = failing_function()
            assert result == "success"
            assert attempt_count == 3
            print("✅ Retry logic working correctly")
        
        # Test non-recoverable error (should not retry)
        attempt_count = 0
        
        @retry_with_exponential_backoff(max_retries=2)
        def non_recoverable_function():
            nonlocal attempt_count
            attempt_count += 1
            raise ValidationError("Invalid format")
        
        try:
            non_recoverable_function()
            print("❌ Non-recoverable error was retried")
            return False
        except ValidationError:
            assert attempt_count == 1  # Should not retry
            print("✅ Non-recoverable error correctly not retried")
        
        print("✅ All error handling tests passed")
        return True
        
    except Exception as e:
        print(f"❌ Error handling test failed: {e}")
        return False

def test_audio_processor_integration():
    """Test audio processor integration with security enhancements."""
    print("\n🔍 Testing Audio Processor Integration...")
    
    try:
        from audio_processor import AudioProcessingService
        
        # Test service initialization
        service = AudioProcessingService(session_id="test-session")
        assert service.session_id == "test-session"
        assert hasattr(service, '_cleanup_lock')
        assert hasattr(service, '_cleanup_done')
        print("✅ Service initialization with security enhancements working")
        
        # Test cleanup thread safety
        cleanup_called = 0
        
        def mock_cleanup(files):
            nonlocal cleanup_called
            cleanup_called += 1
        
        with patch('utils.error_handlers.ErrorRecovery.cleanup_temp_files', mock_cleanup):
            service.temp_files = ['/tmp/test1', '/tmp/test2']
            
            # Call cleanup multiple times (simulating race condition)
            service.cleanup()
            service.cleanup()
            service.cleanup()
            
            # Should only clean up once due to thread safety
            assert cleanup_called == 1
            assert service._cleanup_done == True
            print("✅ Thread-safe cleanup working correctly")
        
        print("✅ All audio processor integration tests passed")
        return True
        
    except Exception as e:
        print(f"❌ Audio processor integration test failed: {e}")
        return False

def test_configuration_validation():
    """Test processing parameter validation."""
    print("\n🔍 Testing Configuration Validation...")
    
    try:
        from utils.input_validation import InputValidator
        
        # Test valid parameters
        valid_params = {
            'silenceThreshold': -25,
            'minSilenceDuration': 1000,
            'createOneShot': True,
            'normalizeAudio': False,
            'outputFormat': 'wav'
        }
        
        validated = InputValidator.validate_processing_parameters(valid_params)
        assert validated['silenceThreshold'] == -25
        assert validated['outputFormat'] == 'wav'
        print("✅ Valid parameter validation passed")
        
        # Test invalid parameters
        invalid_params = {
            'silenceThreshold': -100,  # Too low
            'minSilenceDuration': 5000,  # Too high
            'outputFormat': 'malicious',  # Invalid format
            'unknownParam': 'ignored'  # Should be ignored
        }
        
        try:
            InputValidator.validate_processing_parameters(invalid_params)
            print("❌ Invalid parameters not detected")
            return False
        except Exception:
            print("✅ Invalid parameters correctly rejected")
        
        print("✅ All configuration validation tests passed")
        return True
        
    except Exception as e:
        print(f"❌ Configuration validation test failed: {e}")
        return False

def check_dockerfile_syntax():
    """Check Dockerfile syntax and structure."""
    print("\n🔍 Checking Dockerfile...")
    
    dockerfile_path = Path(__file__).parent / 'Dockerfile'
    
    if not dockerfile_path.exists():
        print("❌ Dockerfile not found")
        return False
    
    try:
        with open(dockerfile_path, 'r') as f:
            content = f.read()
        
        required_components = [
            'FROM python:3.11-slim',
            'RUN apt-get update',
            'ffmpeg',
            'COPY requirements.txt',
            'RUN pip install',
            'USER audioprocess',
            'ENTRYPOINT'
        ]
        
        missing = []
        for component in required_components:
            if component not in content:
                missing.append(component)
        
        if missing:
            print(f"❌ Dockerfile missing components: {missing}")
            return False
        
        print("✅ Dockerfile structure valid")
        return True
        
    except Exception as e:
        print(f"❌ Dockerfile check failed: {e}")
        return False

def check_requirements():
    """Check requirements.txt for security and completeness."""
    print("\n🔍 Checking Requirements...")
    
    req_path = Path(__file__).parent / 'requirements.txt'
    
    if not req_path.exists():
        print("❌ requirements.txt not found")
        return False
    
    try:
        with open(req_path, 'r') as f:
            content = f.read()
        
        # Check for required packages
        required_packages = [
            'boto3==1.34.144',  # Specific version for security
            'pydub==0.25.1',    # Audio processing
            'librosa==0.10.2',  # Advanced audio analysis
            'numpy==1.26.4',    # Numerical operations
            'scipy==1.13.1'     # Scientific computing
        ]
        
        missing = []
        for package in required_packages:
            package_name = package.split('==')[0]
            if package_name not in content:
                missing.append(package)
        
        if missing:
            print(f"❌ requirements.txt missing packages: {missing}")
            return False
        
        # Check for pinned versions (security best practice)
        lines = [line.strip() for line in content.split('\n') if line.strip() and not line.startswith('#')]
        unpinned = []
        for line in lines:
            if '==' not in line and not line.startswith('#'):
                unpinned.append(line)
        
        if unpinned:
            print(f"⚠️  Warning: Unpinned packages found: {unpinned}")
        
        print("✅ Requirements validation passed")
        return True
        
    except Exception as e:
        print(f"❌ Requirements check failed: {e}")
        return False

def main():
    """Run all deployment validation tests."""
    print("🚀 ECS Audio Processing Container - Deployment Validation")
    print("=" * 70)
    
    tests = [
        ("Module Imports", test_imports),
        ("Input Validation", test_input_validation),
        ("Environment Validation", test_environment_validation),
        ("S3 Security Enhancements", test_s3_security_enhancements),
        ("Error Handling", test_error_handling),
        ("Audio Processor Integration", test_audio_processor_integration),
        ("Configuration Validation", test_configuration_validation),
        ("Dockerfile Structure", check_dockerfile_syntax),
        ("Requirements Security", check_requirements)
    ]
    
    passed = 0
    total = len(tests)
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            failed_tests.append(test_name)
    
    print("\n" + "=" * 70)
    print(f"🏁 Deployment Validation Summary: {passed}/{total} tests passed")
    
    if passed == total:
        print("✅ All validation tests passed!")
        print("🎉 Container ready for deployment")
        return True
    else:
        print("❌ Some validation tests failed:")
        for test in failed_tests:
            print(f"   - {test}")
        print("🔧 Please address the issues above before deployment")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
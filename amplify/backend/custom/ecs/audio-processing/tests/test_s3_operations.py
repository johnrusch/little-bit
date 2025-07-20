#!/usr/bin/env python3
"""
Unit tests for S3 operations functionality.
"""

import os
import sys
import unittest
import tempfile
from unittest.mock import Mock, patch, MagicMock
from botocore.exceptions import ClientError

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from s3_operations import S3Operations, S3OperationError
except ImportError as e:
    print(f"Import error in tests: {e}")
    sys.exit(1)

class TestS3Operations(unittest.TestCase):
    """Test S3 operations functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        with patch('boto3.client'):
            self.s3_ops = S3Operations(region_name='us-east-1')
            self.s3_ops.s3_client = Mock()
    
    def test_download_file_success(self):
        """Test successful file download."""
        # Mock successful S3 operations
        self.s3_ops.s3_client.head_object.return_value = {'ContentLength': 1024}
        self.s3_ops.s3_client.download_file.return_value = None
        
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_path = temp_file.name
            temp_file.write(b'test data')
        
        try:
            with patch('os.path.getsize', return_value=1024):
                with patch('os.makedirs'):
                    result = self.s3_ops.download_file('bucket', 'key', temp_path)
                    self.assertTrue(result)
                    
                    # Verify S3 client calls
                    self.s3_ops.s3_client.head_object.assert_called_once_with(
                        Bucket='bucket', Key='key'
                    )
                    self.s3_ops.s3_client.download_file.assert_called_once_with(
                        'bucket', 'key', temp_path
                    )
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_download_file_not_found(self):
        """Test download with file not found error."""
        # Mock S3 not found error
        error_response = {'Error': {'Code': 'NoSuchKey'}}
        self.s3_ops.s3_client.head_object.side_effect = ClientError(error_response, 'HeadObject')
        
        with self.assertRaises(S3OperationError) as context:
            self.s3_ops.download_file('bucket', 'nonexistent', '/tmp/test')
        
        self.assertIn('not found', str(context.exception))
    
    def test_download_file_access_denied(self):
        """Test download with access denied error."""
        error_response = {'Error': {'Code': 'AccessDenied'}}
        self.s3_ops.s3_client.head_object.side_effect = ClientError(error_response, 'HeadObject')
        
        with self.assertRaises(S3OperationError) as context:
            self.s3_ops.download_file('bucket', 'key', '/tmp/test')
        
        self.assertIn('Access denied', str(context.exception))
    
    def test_download_file_invalid_key(self):
        """Test download with invalid S3 key (path traversal)."""
        with self.assertRaises(S3OperationError) as context:
            self.s3_ops.download_file('bucket', '../malicious/path', '/tmp/test')
        
        self.assertIn('path traversal', str(context.exception))
    
    def test_download_file_retry_logic(self):
        """Test retry logic on transient failures."""
        # Mock transient failure followed by success
        self.s3_ops.s3_client.head_object.return_value = {'ContentLength': 1024}
        self.s3_ops.s3_client.download_file.side_effect = [
            Exception("Transient error"),
            Exception("Another transient error"),
            None  # Success on third attempt
        ]
        
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_path = temp_file.name
            temp_file.write(b'test data')
        
        try:
            with patch('os.path.getsize', return_value=1024):
                with patch('os.makedirs'):
                    with patch('time.sleep'):  # Speed up test
                        result = self.s3_ops.download_file('bucket', 'key', temp_path, max_retries=3)
                        self.assertTrue(result)
                        
                        # Should have made 3 download attempts
                        self.assertEqual(self.s3_ops.s3_client.download_file.call_count, 3)
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_upload_file_success(self):
        """Test successful file upload."""
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(b'test data')
            temp_path = temp_file.name
        
        try:
            # Mock successful upload
            self.s3_ops.s3_client.upload_file.return_value = None
            self.s3_ops.s3_client.head_object.return_value = {'ContentLength': 9}
            
            result = self.s3_ops.upload_file(temp_path, 'bucket', 'key')
            self.assertTrue(result)
            
            # Verify S3 client calls
            self.s3_ops.s3_client.upload_file.assert_called_once()
            self.s3_ops.s3_client.head_object.assert_called_once_with(
                Bucket='bucket', Key='key'
            )
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_upload_file_with_metadata(self):
        """Test file upload with metadata."""
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(b'test data')
            temp_path = temp_file.name
        
        try:
            # Mock successful upload
            self.s3_ops.s3_client.upload_file.return_value = None
            self.s3_ops.s3_client.head_object.return_value = {'ContentLength': 9}
            
            metadata = {'session-id': 'test123', 'user-id': 'user456'}
            result = self.s3_ops.upload_file(temp_path, 'bucket', 'key', metadata=metadata)
            self.assertTrue(result)
            
            # Check that upload was called with metadata
            call_args = self.s3_ops.s3_client.upload_file.call_args
            extra_args = call_args[1]['ExtraArgs']
            self.assertIn('Metadata', extra_args)
            self.assertEqual(extra_args['Metadata'], metadata)
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_upload_file_not_found(self):
        """Test upload with non-existent local file."""
        with self.assertRaises(S3OperationError) as context:
            self.s3_ops.upload_file('/nonexistent/file', 'bucket', 'key')
        
        self.assertIn('not found', str(context.exception))
    
    def test_upload_file_empty(self):
        """Test upload with empty file."""
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_path = temp_file.name
            # File is empty
        
        try:
            with self.assertRaises(S3OperationError) as context:
                self.s3_ops.upload_file(temp_path, 'bucket', 'key')
            
            self.assertIn('empty file', str(context.exception))
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_upload_file_invalid_key(self):
        """Test upload with invalid S3 key."""
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(b'test data')
            temp_path = temp_file.name
        
        try:
            with self.assertRaises(S3OperationError) as context:
                self.s3_ops.upload_file(temp_path, 'bucket', '../malicious/path')
            
            self.assertIn('path traversal', str(context.exception))
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_get_file_metadata_success(self):
        """Test successful metadata retrieval."""
        expected_metadata = {
            'ContentLength': 1024,
            'LastModified': '2023-01-01T00:00:00Z',
            'ContentType': 'audio/mp4',
            'Metadata': {'session-id': 'test123'},
            'ETag': '"abc123"'
        }
        
        self.s3_ops.s3_client.head_object.return_value = expected_metadata
        
        result = self.s3_ops.get_file_metadata('bucket', 'key')
        
        self.assertEqual(result['content_length'], 1024)
        self.assertEqual(result['content_type'], 'audio/mp4')
        self.assertEqual(result['metadata'], {'session-id': 'test123'})
        self.assertEqual(result['etag'], 'abc123')  # ETag quotes stripped
    
    def test_get_file_metadata_not_found(self):
        """Test metadata retrieval for non-existent file."""
        error_response = {'Error': {'Code': 'NoSuchKey'}}
        self.s3_ops.s3_client.head_object.side_effect = ClientError(error_response, 'HeadObject')
        
        with self.assertRaises(S3OperationError) as context:
            self.s3_ops.get_file_metadata('bucket', 'nonexistent')
        
        self.assertIn('not found', str(context.exception))
    
    def test_cleanup_temp_files(self):
        """Test temporary file cleanup."""
        # Create temporary files
        temp_files = []
        for i in range(3):
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_file.write(f'test data {i}'.encode())
                temp_files.append(temp_file.name)
        
        # Verify files exist
        for temp_file in temp_files:
            self.assertTrue(os.path.exists(temp_file))
        
        # Clean up files
        self.s3_ops.cleanup_temp_files(temp_files)
        
        # Verify files are removed
        for temp_file in temp_files:
            self.assertFalse(os.path.exists(temp_file))
    
    def test_cleanup_temp_files_nonexistent(self):
        """Test cleanup with non-existent files (should not raise error)."""
        nonexistent_files = ['/tmp/nonexistent1', '/tmp/nonexistent2']
        
        # Should not raise an exception
        self.s3_ops.cleanup_temp_files(nonexistent_files)

class TestS3OperationErrorHandling(unittest.TestCase):
    """Test S3 operation error handling."""
    
    def test_s3_operation_error_creation(self):
        """Test S3OperationError creation and properties."""
        error = S3OperationError("Test error message")
        
        self.assertEqual(str(error), "Test error message")
        self.assertIsInstance(error, Exception)

if __name__ == '__main__':
    # Set up logging to suppress output during tests
    import logging
    logging.getLogger().setLevel(logging.CRITICAL)
    
    unittest.main(verbosity=2)
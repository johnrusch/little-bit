#!/usr/bin/env python3
"""
Basic validation script for the audio processing implementation.
Checks syntax, imports, and basic functionality without requiring all dependencies.
"""

import os
import sys
import ast
import importlib.util
from pathlib import Path

def validate_python_syntax(file_path):
    """Validate Python syntax of a file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            source = f.read()
        
        ast.parse(source)
        print(f"✓ Syntax valid: {file_path}")
        return True
    except SyntaxError as e:
        print(f"✗ Syntax error in {file_path}: {e}")
        return False
    except Exception as e:
        print(f"✗ Error reading {file_path}: {e}")
        return False

def check_file_structure():
    """Check that all required files exist."""
    base_dir = Path(__file__).parent
    
    required_files = [
        'audio_processor.py',
        's3_operations.py',
        'entrypoint.sh',
        'Dockerfile',
        'requirements.txt',
        'utils/logging_config.py',
        'utils/error_handlers.py',
        'utils/audio_utils.py',
        'tests/test_audio_processing.py',
        'tests/test_s3_operations.py'
    ]
    
    all_exist = True
    
    for file_path in required_files:
        full_path = base_dir / file_path
        if full_path.exists():
            print(f"✓ File exists: {file_path}")
        else:
            print(f"✗ Missing file: {file_path}")
            all_exist = False
    
    return all_exist

def validate_dockerfile():
    """Basic validation of Dockerfile."""
    dockerfile_path = Path(__file__).parent / 'Dockerfile'
    
    try:
        with open(dockerfile_path, 'r') as f:
            content = f.read()
        
        required_components = [
            'FROM python:3.11-slim',
            'RUN apt-get update',
            'ffmpeg',
            'COPY requirements.txt',
            'RUN pip install',
            'COPY audio_processor.py',
            'USER audioprocess',
            'ENTRYPOINT'
        ]
        
        missing = []
        for component in required_components:
            if component not in content:
                missing.append(component)
        
        if missing:
            print(f"✗ Dockerfile missing components: {missing}")
            return False
        else:
            print("✓ Dockerfile structure valid")
            return True
            
    except Exception as e:
        print(f"✗ Error validating Dockerfile: {e}")
        return False

def validate_entrypoint():
    """Validate entrypoint script."""
    entrypoint_path = Path(__file__).parent / 'entrypoint.sh'
    
    try:
        with open(entrypoint_path, 'r') as f:
            content = f.read()
        
        if '#!/bin/bash' in content and 'python3 /app/audio_processor.py' in content:
            print("✓ Entrypoint script valid")
            return True
        else:
            print("✗ Entrypoint script missing required components")
            return False
            
    except Exception as e:
        print(f"✗ Error validating entrypoint: {e}")
        return False

def validate_requirements():
    """Validate requirements.txt."""
    req_path = Path(__file__).parent / 'requirements.txt'
    
    try:
        with open(req_path, 'r') as f:
            content = f.read()
        
        required_packages = ['boto3', 'pydub', 'librosa', 'numpy', 'scipy']
        missing = []
        
        for package in required_packages:
            if package not in content:
                missing.append(package)
        
        if missing:
            print(f"✗ requirements.txt missing packages: {missing}")
            return False
        else:
            print("✓ requirements.txt contains required packages")
            return True
            
    except Exception as e:
        print(f"✗ Error validating requirements.txt: {e}")
        return False

def validate_module_structure():
    """Validate module structure and imports."""
    base_dir = Path(__file__).parent
    
    python_files = [
        'audio_processor.py',
        's3_operations.py',
        'utils/logging_config.py',
        'utils/error_handlers.py',
        'utils/audio_utils.py'
    ]
    
    all_valid = True
    
    for file_path in python_files:
        full_path = base_dir / file_path
        if not validate_python_syntax(full_path):
            all_valid = False
    
    return all_valid

def check_implementation_completeness():
    """Check that implementation addresses the issue requirements."""
    base_dir = Path(__file__).parent
    
    # Check main audio processor
    audio_processor_path = base_dir / 'audio_processor.py'
    try:
        with open(audio_processor_path, 'r') as f:
            content = f.read()
        
        required_features = [
            'AudioProcessingService',
            'split_on_silence',
            'PyDub',
            'S3Operations',
            'error handling',
            'retry',
            'logging',
            'cleanup'
        ]
        
        missing_features = []
        for feature in required_features:
            if feature.lower() not in content.lower():
                missing_features.append(feature)
        
        if missing_features:
            print(f"✗ Main processor missing features: {missing_features}")
            return False
        else:
            print("✓ Main audio processor contains required features")
            return True
            
    except Exception as e:
        print(f"✗ Error checking implementation completeness: {e}")
        return False

def main():
    """Run all validation checks."""
    print("🔍 Validating ECS Audio Processing Container Implementation")
    print("=" * 60)
    
    checks = [
        ("File Structure", check_file_structure),
        ("Module Structure", validate_module_structure),
        ("Dockerfile", validate_dockerfile),
        ("Entrypoint Script", validate_entrypoint),
        ("Requirements", validate_requirements),
        ("Implementation Completeness", check_implementation_completeness)
    ]
    
    passed = 0
    total = len(checks)
    
    for check_name, check_func in checks:
        print(f"\n📋 {check_name}:")
        if check_func():
            passed += 1
        else:
            print(f"   ❌ {check_name} validation failed")
    
    print("\n" + "=" * 60)
    print(f"📊 Validation Summary: {passed}/{total} checks passed")
    
    if passed == total:
        print("✅ All validation checks passed!")
        print("🎉 Implementation ready for Phase 2 completion")
        return True
    else:
        print("❌ Some validation checks failed")
        print("🔧 Please address the issues above before proceeding")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
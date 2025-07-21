#!/usr/bin/env python3
"""
Audio Processing Utilities for Little Bit Audio Processing Service
Provides configurable audio processing functions with PyDub integration.
"""

import os
import logging
from typing import List, Dict, Any, Optional, Tuple
from pydub import AudioSegment
from pydub.silence import split_on_silence
from pydub.effects import normalize
import json

from .error_handlers import AudioProcessingError, ValidationError

logger = logging.getLogger(__name__)

class AudioFormat:
    """Supported audio formats and their configurations."""
    
    SUPPORTED_FORMATS = {
        'm4a': {'codec': 'aac', 'container': 'm4a'},
        'wav': {'codec': 'pcm', 'container': 'wav'},
        'mp3': {'codec': 'mp3', 'container': 'mp3'},
        'aac': {'codec': 'aac', 'container': 'aac'},
        'flac': {'codec': 'flac', 'container': 'flac'}
    }
    
    @staticmethod
    def is_supported(format_str: str) -> bool:
        """Check if audio format is supported."""
        return format_str.lower() in AudioFormat.SUPPORTED_FORMATS
    
    @staticmethod
    def get_format_info(format_str: str) -> Dict[str, str]:
        """Get format information for a given format."""
        return AudioFormat.SUPPORTED_FORMATS.get(format_str.lower(), {})

class AudioProcessingConfig:
    """Configuration class for audio processing parameters."""
    
    def __init__(self, config_dict: Optional[Dict[str, Any]] = None):
        """
        Initialize audio processing configuration.
        
        Args:
            config_dict: Configuration dictionary from environment or parameters
        """
        config = config_dict or {}
        
        # Silence detection parameters
        self.silence_threshold = self._validate_range(
            config.get('silenceThreshold', -30), -50, -20, 'silenceThreshold'
        )
        self.min_silence_duration = int(self._validate_range(
            config.get('minSilenceDuration', 750), 500, 2000, 'minSilenceDuration'
        ))
        self.keep_silence = int(self._validate_range(
            config.get('keepSilence', 50), 0, 500, 'keepSilence'
        ))
        
        # Processing options
        self.create_one_shot = config.get('createOneShot', True)
        self.normalize_audio = config.get('normalizeAudio', True)
        self.target_dbfs = self._validate_range(
            config.get('targetDbfs', -20.0), -30.0, -10.0, 'targetDbfs'
        )
        self.preserve_original = config.get('preserveOriginal', True)
        self.output_format = config.get('outputFormat', 'original')
        
        # Auto-detection settings
        self.auto_detect_threshold = config.get('autoDetectThreshold', False)
        self.analysis_window_ms = int(self._validate_range(
            config.get('analysisWindowMs', 1000), 500, 5000, 'analysisWindowMs'
        ))
        
        # Quality settings
        self.quality_settings = {
            'bitrate': config.get('bitrate', 'original'),
            'sample_rate': config.get('sampleRate', 'original'),
            'channels': config.get('channels', 'original')
        }
        
        logger.info(f"Audio processing configuration initialized: {self.to_dict()}")
    
    def _validate_range(self, value: Any, min_val: float, max_val: float, param_name: str) -> float:
        """Validate parameter is within acceptable range."""
        try:
            float_val = float(value)
            if min_val <= float_val <= max_val:
                return float_val
            else:
                logger.warning(f"Parameter {param_name} value {float_val} outside range [{min_val}, {max_val}], using default")
                return (min_val + max_val) / 2  # Use midpoint as default
        except (ValueError, TypeError):
            logger.warning(f"Invalid {param_name} value: {value}, using default")
            return (min_val + max_val) / 2
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary for logging."""
        return {
            'silence_threshold': self.silence_threshold,
            'min_silence_duration': self.min_silence_duration,
            'keep_silence': self.keep_silence,
            'create_one_shot': self.create_one_shot,
            'normalize_audio': self.normalize_audio,
            'target_dbfs': self.target_dbfs,
            'preserve_original': self.preserve_original,
            'output_format': self.output_format,
            'auto_detect_threshold': self.auto_detect_threshold,
            'quality_settings': self.quality_settings
        }

class AudioProcessor:
    """Main audio processing class with PyDub-based operations."""
    
    def __init__(self, config: AudioProcessingConfig):
        """Initialize audio processor with configuration."""
        self.config = config
        logger.info("AudioProcessor initialized")
    
    def analyze_audio(self, audio: AudioSegment) -> Dict[str, Any]:
        """
        Analyze audio characteristics for optimal processing parameters.
        
        Args:
            audio: AudioSegment to analyze
            
        Returns:
            Dictionary with audio analysis results
        """
        try:
            analysis = {
                'duration_seconds': audio.duration_seconds,
                'duration_ms': len(audio),
                'channels': audio.channels,
                'frame_rate': audio.frame_rate,
                'sample_width': audio.sample_width,
                'max_dbfs': audio.max_dBFS,
                'dbfs': audio.dBFS,
                'rms': audio.rms
            }
            
            # Analyze silence characteristics
            if self.config.auto_detect_threshold:
                optimal_threshold = self._analyze_silence_threshold(audio)
                analysis['recommended_silence_threshold'] = optimal_threshold
                logger.info(f"Recommended silence threshold: {optimal_threshold} dBFS")
            
            logger.info(f"Audio analysis completed: {analysis}")
            return analysis
            
        except Exception as e:
            raise AudioProcessingError(f"Audio analysis failed: {str(e)}")
    
    def _analyze_silence_threshold(self, audio: AudioSegment) -> float:
        """
        Analyze audio to determine optimal silence threshold.
        
        Args:
            audio: AudioSegment to analyze
            
        Returns:
            Recommended silence threshold in dBFS
        """
        try:
            # Sample the audio at regular intervals
            window_size = int(self.config.analysis_window_ms)
            samples = []
            
            for i in range(0, len(audio), window_size):
                chunk = audio[i:i + window_size]
                if len(chunk) > 100:  # Ignore very short chunks
                    samples.append(chunk.dBFS)
            
            if not samples:
                return self.config.silence_threshold
            
            # Use statistical analysis to find appropriate threshold
            sorted_samples = sorted(samples)
            percentile_20 = sorted_samples[len(sorted_samples) // 5]  # 20th percentile
            
            # Set threshold slightly above the 20th percentile
            recommended = max(percentile_20 + 5, -45)  # Don't go below -45 dBFS
            recommended = min(recommended, -20)  # Don't go above -20 dBFS
            
            return round(recommended, 1)
            
        except Exception as e:
            logger.warning(f"Silence threshold analysis failed: {str(e)}, using default")
            return self.config.silence_threshold
    
    def process_audio_file(self, input_path: str, output_dir: str, 
                          base_filename: str) -> List[Dict[str, Any]]:
        """
        Process audio file and create one-shots using silence detection.
        
        Args:
            input_path: Path to input audio file
            output_dir: Directory for output files
            base_filename: Base filename for output files
            
        Returns:
            List of processing results with file information
        """
        if not os.path.exists(input_path):
            raise ValidationError(f"Input file not found: {input_path}")
        
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
        
        try:
            # Load audio file
            file_ext = os.path.splitext(input_path)[1][1:].lower()
            if not AudioFormat.is_supported(file_ext):
                raise AudioProcessingError(f"Unsupported audio format: {file_ext}")
            
            logger.info(f"Loading audio file: {input_path} (format: {file_ext})")
            audio = AudioSegment.from_file(input_path, format=file_ext)
            
            # Analyze audio characteristics
            analysis = self.analyze_audio(audio)
            
            # Use auto-detected threshold if enabled
            silence_threshold = analysis.get('recommended_silence_threshold', 
                                           self.config.silence_threshold)
            
            # Process audio based on configuration
            results = []
            
            if self.config.create_one_shot:
                results.extend(self._create_one_shots(
                    audio, output_dir, base_filename, silence_threshold, analysis
                ))
            
            if self.config.preserve_original:
                original_result = self._save_original(
                    audio, output_dir, base_filename, analysis
                )
                results.append(original_result)
            
            logger.info(f"Audio processing completed: {len(results)} files created")
            return results
            
        except Exception as e:
            if isinstance(e, (AudioProcessingError, ValidationError)):
                raise
            else:
                raise AudioProcessingError(f"Audio processing failed: {str(e)}")
    
    def _create_one_shots(self, audio: AudioSegment, output_dir: str, 
                         base_filename: str, silence_threshold: float,
                         analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Create one-shot audio files using silence detection.
        
        Args:
            audio: AudioSegment to process
            output_dir: Output directory
            base_filename: Base filename
            silence_threshold: Silence threshold in dBFS
            analysis: Audio analysis results
            
        Returns:
            List of created file information
        """
        logger.info(f"Creating one-shots with threshold: {silence_threshold} dBFS, "
                   f"min silence: {self.config.min_silence_duration}ms")
        
        try:
            # Split on silence using configurable parameters
            # Note: All parameters must be integers for PyDub's internal range() calls
            chunks = split_on_silence(
                audio,
                min_silence_len=int(self.config.min_silence_duration),
                silence_thresh=silence_threshold,
                keep_silence=int(self.config.keep_silence),
                seek_step=int(self.config.min_silence_duration / 10)  # Explicit to avoid float default
            )
            
            if not chunks:
                logger.warning("No chunks detected - creating single file from entire audio")
                chunks = [audio]
            
            logger.info(f"Split audio into {len(chunks)} chunks")
            
            results = []
            for i, chunk in enumerate(chunks):
                result = self._process_chunk(
                    chunk, output_dir, base_filename, i, analysis
                )
                results.append(result)
            
            return results
            
        except Exception as e:
            raise AudioProcessingError(f"One-shot creation failed: {str(e)}")
    
    def _process_chunk(self, chunk: AudioSegment, output_dir: str, 
                      base_filename: str, index: int, 
                      analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process individual audio chunk with normalization and padding.
        
        Args:
            chunk: Audio chunk to process
            output_dir: Output directory
            base_filename: Base filename
            index: Chunk index
            analysis: Original audio analysis
            
        Returns:
            File information dictionary
        """
        try:
            # Add padding silence
            beginning_silence = AudioSegment.silent(duration=25)  # Reduced from 250ms
            ending_silence = AudioSegment.silent(duration=75)     # Reduced from 750ms
            
            padded_chunk = beginning_silence + chunk + ending_silence
            
            # Normalize audio if enabled
            if self.config.normalize_audio:
                normalized_chunk = self._normalize_chunk(padded_chunk)
            else:
                normalized_chunk = padded_chunk
            
            # Determine output format
            output_format = self._get_output_format(analysis)
            
            # Generate filename
            filename = f"{base_filename}-{index}.{output_format}"
            output_path = os.path.join(output_dir, filename)
            
            # Export audio chunk
            export_params = self._get_export_parameters(output_format)
            normalized_chunk.export(output_path, format=output_format, **export_params)
            
            # Verify file was created
            if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
                raise AudioProcessingError(f"Failed to create output file: {output_path}")
            
            file_info = {
                'filename': filename,
                'path': output_path,
                'format': output_format,
                'duration_seconds': normalized_chunk.duration_seconds,
                'file_size_bytes': os.path.getsize(output_path),
                'chunk_index': index,
                'dbfs': normalized_chunk.dBFS,
                'max_dbfs': normalized_chunk.max_dBFS
            }
            
            logger.info(f"Created chunk {index}: {filename} "
                       f"({file_info['duration_seconds']:.2f}s, "
                       f"{file_info['file_size_bytes']} bytes)")
            
            return file_info
            
        except Exception as e:
            raise AudioProcessingError(f"Chunk processing failed for index {index}: {str(e)}")
    
    def _normalize_chunk(self, chunk: AudioSegment) -> AudioSegment:
        """
        Normalize audio chunk to target dBFS level.
        
        Args:
            chunk: Audio chunk to normalize
            
        Returns:
            Normalized audio chunk
        """
        try:
            # Apply gain to reach target dBFS
            change_in_dbfs = self.config.target_dbfs - chunk.dBFS
            normalized = chunk.apply_gain(change_in_dbfs)
            
            # Optional: Use pydub's normalize function for additional processing
            # normalized = normalize(normalized)
            
            return normalized
            
        except Exception as e:
            logger.warning(f"Normalization failed, using original chunk: {str(e)}")
            return chunk
    
    def _save_original(self, audio: AudioSegment, output_dir: str, 
                      base_filename: str, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Save original audio file to output directory.
        
        Args:
            audio: Original audio segment
            output_dir: Output directory
            base_filename: Base filename
            analysis: Audio analysis results
            
        Returns:
            File information dictionary
        """
        try:
            output_format = self._get_output_format(analysis)
            filename = f"{base_filename}-original.{output_format}"
            output_path = os.path.join(output_dir, filename)
            
            export_params = self._get_export_parameters(output_format)
            audio.export(output_path, format=output_format, **export_params)
            
            file_info = {
                'filename': filename,
                'path': output_path,
                'format': output_format,
                'duration_seconds': audio.duration_seconds,
                'file_size_bytes': os.path.getsize(output_path),
                'chunk_index': -1,  # Indicates original file
                'dbfs': audio.dBFS,
                'max_dbfs': audio.max_dBFS
            }
            
            logger.info(f"Saved original file: {filename}")
            return file_info
            
        except Exception as e:
            raise AudioProcessingError(f"Failed to save original file: {str(e)}")
    
    def _get_output_format(self, analysis: Dict[str, Any]) -> str:
        """
        Determine output format based on configuration and input format.
        
        Args:
            analysis: Audio analysis results
            
        Returns:
            Output format string
        """
        if self.config.output_format == 'original':
            # Try to preserve original format, default to wav
            return 'wav'  # Safe default format
        else:
            format_str = self.config.output_format.lower()
            if AudioFormat.is_supported(format_str):
                return format_str
            else:
                logger.warning(f"Unsupported output format: {format_str}, using wav")
                return 'wav'
    
    def _get_export_parameters(self, format_str: str) -> Dict[str, Any]:
        """
        Get export parameters for specific audio format.
        
        Args:
            format_str: Audio format string
            
        Returns:
            Dictionary of export parameters
        """
        params = {}
        
        # Quality settings based on format
        if format_str == 'mp3':
            if self.config.quality_settings['bitrate'] != 'original':
                params['bitrate'] = self.config.quality_settings['bitrate']
        elif format_str == 'wav':
            # WAV format parameters
            pass  # WAV uses default parameters
        elif format_str in ['m4a', 'aac']:
            # AAC format parameters
            if self.config.quality_settings['bitrate'] != 'original':
                params['bitrate'] = self.config.quality_settings['bitrate']
        
        return params

def create_processing_config(env_vars: Dict[str, str]) -> AudioProcessingConfig:
    """
    Create audio processing configuration from environment variables.
    
    Args:
        env_vars: Dictionary of environment variables
        
    Returns:
        AudioProcessingConfig instance
    """
    # Parse processing parameters from environment
    processing_params = env_vars.get('PROCESSING_PARAMS', '{}')
    
    try:
        config_dict = json.loads(processing_params)
    except json.JSONDecodeError as e:
        logger.warning(f"Invalid PROCESSING_PARAMS JSON: {str(e)}, using defaults")
        config_dict = {}
    
    # Add additional environment-based configuration (can override JSON params)
    if env_vars.get('PRESERVE_ORIGINAL'):
        config_dict['preserveOriginal'] = env_vars.get('PRESERVE_ORIGINAL', 'true').lower() == 'true'
    if env_vars.get('OUTPUT_FORMAT'):
        config_dict['outputFormat'] = env_vars.get('OUTPUT_FORMAT', 'original').lower()
    
    return AudioProcessingConfig(config_dict)
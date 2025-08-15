import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

interface FaceCropperProps {
  imageSrc: string;
  onCropped: (croppedImageUrl: string) => void;
  className?: string;
  alt?: string;
}

const FaceCropper: React.FC<FaceCropperProps> = ({ 
  imageSrc, 
  onCropped, 
  className = '', 
  alt = 'Fashion image' 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Load face detection models
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        ]);
      } catch (error) {
        console.log('Models already loaded or loading from CDN');
        // Try loading from CDN if local models not available
        try {
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
          ]);
        } catch (cdnError) {
          console.error('Failed to load face detection models:', cdnError);
        }
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    if (!imageSrc || hasProcessed) return;

    const processImage = async () => {
      if (!imgRef.current || !canvasRef.current) return;

      setIsProcessing(true);
      
      try {
        // Wait for image to load
        await new Promise((resolve) => {
          if (imgRef.current?.complete) {
            resolve(true);
          } else {
            imgRef.current!.onload = () => resolve(true);
          }
        });

        const img = imgRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Set canvas size to match image
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Detect faces
        const detections = await faceapi.detectAllFaces(
          img, 
          new faceapi.TinyFaceDetectorOptions()
        );

        if (detections.length > 0) {
          // Find the largest face (usually the main subject)
          const largestFace = detections.reduce((largest, current) => {
            const currentArea = current.box.width * current.box.height;
            const largestArea = largest.box.width * largest.box.height;
            return currentArea > largestArea ? current : largest;
          });

          // Calculate crop area to focus on clothing while avoiding face
          const faceBox = largestFace.box;
          const cropPadding = 50; // Padding around the face area
          
          // Crop from below the face to focus on clothing
          const cropY = Math.min(faceBox.y + faceBox.height + cropPadding, img.naturalHeight);
          const cropHeight = img.naturalHeight - cropY;
          
          // If there's not enough content below face, crop from above
          if (cropHeight < img.naturalHeight * 0.4) {
            const cropFromAbove = Math.max(faceBox.y - cropPadding, 0);
            const cropHeightFromAbove = img.naturalHeight - cropFromAbove;
            
            // Draw cropped image focusing on clothing area
            ctx.drawImage(
              img,
              0, cropFromAbove, img.naturalWidth, cropHeightFromAbove,
              0, 0, canvas.width, canvas.height
            );
          } else {
            // Draw cropped image from below face
            ctx.drawImage(
              img,
              0, cropY, img.naturalWidth, cropHeight,
              0, 0, canvas.width, canvas.height
            );
          }
        } else {
          // No faces detected, use original image
          ctx.drawImage(img, 0, 0);
        }

        // Convert canvas to blob and create URL
        canvas.toBlob((blob) => {
          if (blob) {
            const croppedUrl = URL.createObjectURL(blob);
            onCropped(croppedUrl);
            setHasProcessed(true);
          }
        }, 'image/jpeg', 0.9);

      } catch (error) {
        console.error('Error processing image:', error);
        // Fallback to original image
        onCropped(imageSrc);
        setHasProcessed(true);
      } finally {
        setIsProcessing(false);
      }
    };

    processImage();
  }, [imageSrc, hasProcessed, onCropped]);

  return (
    <div className="face-cropper">
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-spinner"></div>
          <span>Processing image...</span>
        </div>
      )}
      
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={className}
        style={{ display: 'none' }} // Hide original image
      />
      
      <canvas
        ref={canvasRef}
        className={className}
        style={{ display: isProcessing ? 'none' : 'block' }}
      />
    </div>
  );
};

export default FaceCropper;

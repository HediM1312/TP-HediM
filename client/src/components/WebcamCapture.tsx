'use client';
import { useRef, useState } from 'react';

interface WebcamCaptureProps {
  onImageCaptured?: (imageData: string) => void;
}

const WebcamCapture = ({ onImageCaptured }: WebcamCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const requestWebcamAccess = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: 400,
          height: 400,
          facingMode: "user",
          aspectRatio: 1
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasPermission(true);
      }
    } catch (err) {
      console.error("Erreur d'accès à la webcam:", err);
      setError("Impossible d'accéder à la webcam. Vérifiez vos permissions ou votre matériel.");
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setHasPermission(false);
      setCapturedImage(null);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const context = canvasRef.current.getContext('2d');
      if (!context) return;

      context.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      const imageData = canvasRef.current.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      
      if (onImageCaptured) {
        onImageCaptured(imageData);
      }

      sendImageToBackend(imageData);
    } catch (err) {
      console.error("Erreur lors de la capture:", err);
      setError("Erreur lors de la capture de l'image");
    }
  };

  const sendImageToBackend = async (imageData: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('http://localhost:8000/api/emotion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('Réponse du backend:', data);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'image:', error);
      setError("Erreur lors de l'envoi de l'image");
    } finally {
      setIsLoading(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setError(null);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 max-w-xl mx-auto">
      {/* Messages d'erreur */}
      {error && (
        <div className="w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Bouton d'activation webcam */}
      {!hasPermission && !isLoading && (
        <button
          onClick={requestWebcamAccess}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
        >
          Activer la webcam
        </button>
      )}

      {/* Loader */}
      {isLoading && (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Affichage webcam/image */}
      {hasPermission && (
        <div className="relative w-full aspect-square max-w-md">
          {!capturedImage ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="rounded-lg shadow-lg w-full h-full object-cover"
            />
          ) : (
            <img 
              src={capturedImage}
              alt="Captured"
              className="rounded-lg shadow-lg w-full h-full object-cover"
            />
          )}
        </div>
      )}

      {/* Canvas caché */}
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="hidden"
      />

      {/* Boutons d'action */}
      {hasPermission && !isLoading && (
        <div className="flex gap-4">
          {!capturedImage ? (
            <button
              onClick={captureImage}
              className="px-6 py-2 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 text-white"
            >
              Capturer
            </button>
          ) : (
            <button
              onClick={retakePhoto}
              className="px-6 py-2 rounded-lg font-medium bg-gray-500 hover:bg-gray-600 text-white"
            >
              Reprendre
            </button>
          )}
          
          <button
            onClick={stopWebcam}
            className="px-6 py-2 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white"
          >
            Arrêter la webcam
          </button>
        </div>
      )}

      {/* État de la webcam */}
      <div className="text-sm text-gray-600">
        État de la webcam : {hasPermission ? '✅ Active' : '❌ Inactive'}
      </div>
    </div>
  );
};

export default WebcamCapture;
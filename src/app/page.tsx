'use client';

import { useRef, useState, useEffect } from 'react';
import * as fabric from 'fabric';

// Available stickers
const STICKERS = [
  '/stickers/Frame 25.png',
  '/stickers/Frame 26.png',
  '/stickers/Frame 27.png',
  '/stickers/Frame 28.png',
  '/stickers/Frame 29.png',
  '/stickers/Frame 30.png',
  '/stickers/Frame 31.png',
  '/stickers/Frame 32.png',
  '/stickers/Frame 33.png',
  '/stickers/Frame 34.png',
  '/stickers/Frame 35.png',
  '/stickers/Frame 36.png',
  '/stickers/Frame 37.png',
  '/stickers/Frame 38.png',
];

export default function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const editCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [showEditPage, setShowEditPage] = useState(false);
  const [currentEditIndex, setCurrentEditIndex] = useState(0);
  const [assetIndex, setAssetIndex] = useState(0);
  const [userName, setUserName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [beautyLevel, setBeautyLevel] = useState(50);
  const [isBeautyEnabled, setIsBeautyEnabled] = useState(false);

  const backgrounds = [
    '/images/background.png',
    '/images/background1.png',
    '/images/background2.png',
    '/images/background.3.png'
  ];

  const characters = [
    '/character/1.png',
    '/character/2.png',
    '/character/3.png',
    '/character/4.png',
    '/character/5.png',
    '/character/6.png'
  ];

  // Rotate assets every 5 seconds, or follow countdown
  useEffect(() => {
    if (isCountingDown && countdown !== null) {
      setAssetIndex(countdown);
      return;
    }
    const interval = setInterval(() => {
      setAssetIndex(prev => (prev + 1) % 6);
    }, 5000);
    return () => clearInterval(interval);
  }, [isCountingDown, countdown]);

  const posterRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Start camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setStream(mediaStream);
      setIsCameraOn(true);
      setError(null);
    } catch (err) {
      setError('Failed to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraOn(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  // Start countdown before capture
  const startCountdown = () => {
    setIsCountingDown(true);
    setCountdown(3);
  };

  // Countdown effect
  useEffect(() => {
    if (countdown === null || countdown === 0) {
      if (countdown === 0) {
        // Capture the photo when countdown reaches 0
        capturePhotoNow();
        setCountdown(null);
        setIsCountingDown(false);
      }
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Actual photo capture
  const capturePhotoNow = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        context.save();

        // Apply Beauty Filter logic
        if (isBeautyEnabled) {
          // Calculate values based on beautyLevel (0-100)
          const blurVal = (beautyLevel / 100) * 1.5; // Max 1.5px blur
          const brightVal = 1 + (beautyLevel / 100) * 0.15; // Max 1.15x brightness
          const contrastVal = 1 + (beautyLevel / 100) * 0.05; // Max 1.05x contrast

          context.filter = `brightness(${brightVal}) contrast(${contrastVal}) blur(${blurVal}px)`;
        }

        // Flip the image horizontally and draw
        context.scale(-1, 1);
        context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);

        context.restore();

        const imageDataUrl = canvas.toDataURL('image/png');

        // Add new photo (limit to 4 photos)
        setCapturedImages(prev => {
          if (prev.length >= 4) {
            return [...prev.slice(1), imageDataUrl]; // Cycle if full
          }
          return [...prev, imageDataUrl];
        });
      }
    }
  };

  // Delete a specific photo
  const deletePhoto = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Clear all photos
  const clearAllPhotos = () => {
    setCapturedImages([]);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        setCapturedImages(prev => {
          if (prev.length >= 1) {
            return [imageDataUrl]; // Replace existing photo
          }
          return [...prev, imageDataUrl];
        });
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid image file');
    }
    // Reset input so same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };

  // Go to edit page
  const goToEdit = () => {
    stopCamera();
    setShowNameInput(true);
  };

  // After name is entered, go to edit page
  const proceedToEdit = () => {
    if (userName.trim()) {
      setShowNameInput(false);
      setShowEditPage(true);
      setCurrentEditIndex(0);
    } else {
      alert('Please enter your name!');
    }
  };

  // Calculate font size based on name length (for download - full size)
  const getNameFontSize = () => {
    const length = userName.length;
    if (length <= 4) return '120px';
    if (length <= 6) return '100px';
    if (length <= 8) return '80px';
    if (length <= 10) return '75px';
    if (length <= 14) return '55px';
    if (length <= 18) return '40px';
    if (length <= 22) return '32px';
    return '28px';
  };

  // Calculate font size for display (scaled down by 0.659)
  const getDisplayFontSize = () => {
    const fullSize = parseInt(getNameFontSize());
    return `${Math.round(fullSize * 0.659)}px`;
  };

  // Go back to camera
  const backToCamera = () => {
    setShowEditPage(false);
  };

  // Initialize Fabric.js canvas when edit page is shown
  useEffect(() => {
    let mounted = true;

    const initializeCanvas = async () => {
      if (!showEditPage || !editCanvasRef.current || fabricCanvasRef.current) return;

      // Canvas covers the entire poster area (500x735)
      const canvas = new fabric.Canvas(editCanvasRef.current, {
        width: 500,
        height: 735,
        backgroundColor: 'transparent',
      });

      fabricCanvasRef.current = canvas;

      try {
        const frameImg = await fabric.FabricImage.fromURL('/frame/frame.svg');
        if (!mounted) return;

        frameImg.scaleToWidth(500);
        frameImg.scaleToHeight(735);
        frameImg.set({
          left: 0,
          top: 0,
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false,
        });

        // Load the photo first
        if (capturedImages[currentEditIndex]) {
          const photoImg = await fabric.FabricImage.fromURL(capturedImages[currentEditIndex]);
          if (!mounted) return;

          // Black area in SVG: x:59.5-684, y:234.5-704 (at 759x1117)
          // Scaled to 500x735: multiply by (500/759)
          const scale = 500 / 759;
          const photoLeft = 59.5 * scale; // ~39.2px
          const photoTop = 234.5 * scale; // ~154.7px
          const photoWidth = (684 - 59.5) * scale; // ~411.7px
          const photoHeight = (704 - 234.5) * scale; // ~309.6px

          // Get the original dimensions to calculate aspect ratio
          const imgWidth = photoImg.width || 1;
          const imgHeight = photoImg.height || 1;
          const imgAspect = imgWidth / imgHeight;
          const frameAspect = photoWidth / photoHeight;

          // Use cover logic: scale to fill the frame completely
          let scaleX, scaleY;
          if (imgAspect > frameAspect) {
            // Image is wider - fit to height
            scaleY = photoHeight / imgHeight;
            scaleX = scaleY;
          } else {
            // Image is taller - fit to width
            scaleX = photoWidth / imgWidth;
            scaleY = scaleX;
          }

          photoImg.set({
            left: photoLeft + (photoWidth / 2),
            top: photoTop + (photoHeight / 2),
            originX: 'center',
            originY: 'center',
            scaleX: scaleX,
            scaleY: scaleY,
            selectable: false,
            evented: false,
          });

          canvas.add(photoImg);
        }

        // Add frame on top of the photo
        canvas.add(frameImg);
        canvas.bringObjectToFront(frameImg);

        canvas.renderAll();
      } catch (error) {
        console.error('Error loading images:', error);
      }
    };

    initializeCanvas();

    // Cleanup Fabric canvas when leaving edit page
    return () => {
      mounted = false;
      if (fabricCanvasRef.current) {
        try {
          // Clear all objects before disposing
          fabricCanvasRef.current.clear();
          fabricCanvasRef.current.dispose();
        } catch (e) {
          console.warn('Canvas disposal error:', e);
        }
        fabricCanvasRef.current = null;
      }
    };
  }, [showEditPage, currentEditIndex, capturedImages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.clear();
          fabricCanvasRef.current.dispose();
        } catch (e) {
          console.warn('Canvas cleanup error:', e);
        }
      }
    };
  }, []);

  // Add sticker to Fabric.js canvas
  const addSticker = (stickerSrc: string) => {
    if (!fabricCanvasRef.current) return;

    fabric.FabricImage.fromURL(stickerSrc).then((img) => {
      img.scale(0.5); // Scale down to reasonable size
      img.set({
        left: 250, // Center of 500px canvas
        top: 367.5, // Center of 735px canvas
        selectable: true,
        hasControls: true,
        hasBorders: true,
      });

      fabricCanvasRef.current?.add(img);
      fabricCanvasRef.current?.setActiveObject(img);
      fabricCanvasRef.current?.renderAll();
    });
  };

  // Remove selected sticker from Fabric canvas
  const removeSticker = () => {
    if (!fabricCanvasRef.current) return;
    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject && activeObject !== fabricCanvasRef.current.backgroundImage) {
      fabricCanvasRef.current.remove(activeObject);
      fabricCanvasRef.current.renderAll();
    }
  };

  // Download the final poster using Fabric.js
  const downloadPoster = async () => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;

    try {
      await document.fonts.ready;

      // Draw the name text temporarily on the main canvas
      const centerX = 500 / 2;
      const centerY = 527 + (85.5 / 2);

      const nameText = new fabric.FabricText(userName || 'YOUR NAME', {
        left: centerX,
        top: centerY,
        fontSize: parseInt(getDisplayFontSize()),
        fontFamily: 'Times New Roman',
        fontWeight: 'bold',
        fill: '#000',
        originX: 'center',
        originY: 'center',
        charSpacing: 50, // Match CSS 4px spacing approx
        scaleY: 1.3,
        selectable: false,
      });

      // Position must match the absolute name box
      // Left: 39.5, Top: 527, Width: 402, Height: 85.5
      // Center X = 39.5 + 201 = 240.5
      // Center Y = 527 + 42.75 = 569.75
      nameText.set({
        left: 240.5,
        top: 569.75,
      });

      canvas.add(nameText);
      canvas.bringObjectToFront(nameText);
      canvas.renderAll();

      // Clear selection before download
      canvas.discardActiveObject();
      canvas.renderAll();

      // Download
      const multiplier = 759 / 500;
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: multiplier,
      });

      const link = document.createElement('a');
      link.download = `wanted-${userName || 'nakama'}.png`;
      link.href = dataURL;
      link.click();

      // Remove temporary text
      canvas.remove(nameText);
      canvas.renderAll();
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading. Please try again: ' + error);
    }
  };

  // Show name input modal
  if (showNameInput) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          backgroundImage: 'url(/images/background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div
          className="bg-[#2d1b0d] p-8 border-4 border-[#fdd017] shadow-[4px_4px_0px_#000000]"
          style={{
            clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))',
            maxWidth: '500px',
            width: '100%'
          }}
        >
          <h2 className="text-2xl font-bold mb-6 text-center text-white" style={{ fontFamily: 'Times New Roman, serif' }}>
            Enter Your Name
          </h2>
          <input
            ref={nameInputRef}
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value.toUpperCase())}
            placeholder="YOUR NAME"
            className="w-full px-4 py-3 text-2xl font-bold border-4 border-[#fdd017] mb-6 text-center text-white bg-[#3d2b1d] active-route uppercase transition-all focus:border-[#FF7043] outline-none shadow-[4px_4px_0px_#000000]"
            style={{
              fontFamily: 'Times New Roman, serif',
              clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
            }}
            maxLength={30}
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                proceedToEdit();
              }
            }}
          />
          <div className="flex gap-4">
            <button
              onClick={() => {
                setShowNameInput(false);
                setUserName('');
              }}
              className="flex-1 px-6 py-3 bg-[#3d2b1d] text-white hover:opacity-80 font-bold text-sm border-4 border-[#fdd017] shadow-[4px_4px_0px_#000000] transition-all"
              style={{
                fontFamily: 'Times New Roman, serif',
                clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
              }}
            >
              Cancel
            </button>
            <button
              onClick={proceedToEdit}
              className="flex-1 px-6 py-3 text-white hover:opacity-80 font-bold text-sm border-4 border-[#fdd017] shadow-[4px_4px_0px_#000000] transition-all"
              style={{
                backgroundColor: '#FF7043',
                fontFamily: 'Times New Roman, serif',
                clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If on edit page, show sticker editor
  if (showEditPage) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 gap-6"
        style={{
          backgroundImage: 'url(/images/background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Header with title and close button */}
        <div className="w-full max-w-4xl flex justify-between items-center">
          <h1
            className="text-white font-bold text-2xl tracking-wider"
            style={{
              textShadow: '4px 4px 0px #000',
              fontFamily: 'var(--font-press-start)',
            }}
          >
            NAKAMA BOOTH
          </h1>
          <button
            onClick={() => {
              if (fabricCanvasRef.current) {
                try {
                  fabricCanvasRef.current.clear();
                  fabricCanvasRef.current.dispose();
                } catch (e) {
                  console.warn('Canvas disposal error:', e);
                }
                fabricCanvasRef.current = null;
              }
              setShowEditPage(false);
              setUserName('');
            }}
            className="text-white text-3xl hover:opacity-80 transition-all"
            style={{ textShadow: '2px 2px 0px #000' }}
          >
            ✕
          </button>
        </div>

        {/* Horizontal Sticker Gallery */}
        <div className="w-full max-w-4xl overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max px-2">
            {STICKERS.map((sticker, index) => (
              <button
                key={index}
                onClick={() => addSticker(sticker)}
                className="hover:opacity-80 transition-all p-2 flex-shrink-0 border-4 border-[#fdd017] shadow-[4px_4px_0px_#000000]"
                style={{
                  backgroundColor: '#3d2b1d',
                  width: '80px',
                  height: '80px',
                }}
              >
                <img src={sticker} alt={`Sticker ${index + 1}`} className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        </div>

        {/* Main editing area */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative overflow-hidden" ref={posterRef} style={{ width: '500px', height: '735px', backgroundColor: '#000' }}>
            <canvas ref={editCanvasRef} />

            {/* Name text box positioned on the poster - matching SVG rect */}
            <div
              className="absolute flex items-center justify-center pointer-events-none"
              style={{
                left: '39.5px',
                top: '527px',
                width: '402px',
                height: '85.5px',
                zIndex: 10,
              }}
            >
              <div
                data-name-text
                className="font-bold text-center uppercase break-words px-4"
                style={{
                  fontFamily: 'Times New Roman, serif',
                  fontSize: getDisplayFontSize(),
                  lineHeight: '1.2',
                  color: '#000',
                  maxWidth: '100%',
                  wordWrap: 'break-word',
                  letterSpacing: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'scaleY(1.3)',
                }}
              >
                {userName || 'YOUR NAME'}
              </div>
            </div>
          </div>

          {/* Action buttons below the poster */}
          <div className="flex gap-4">
            <button
              onClick={removeSticker}
              className="px-6 py-3 bg-red-500 text-white hover:bg-red-600 font-bold text-sm border-4 border-[#fdd017] shadow-[4px_4px_0px_#000000] transition-all"
              style={{
                clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
                fontFamily: 'var(--font-press-start)',
              }}
            >
              DELETE
            </button>
            <button
              onClick={downloadPoster}
              className="px-6 py-3 text-white hover:opacity-80 font-bold text-sm border-4 border-[#fdd017] shadow-[4px_4px_0px_#000000] transition-all"
              style={{
                backgroundColor: '#FF7043',
                clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
                fontFamily: 'var(--font-press-start)',
              }}
            >
              DOWNLOAD
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex gap-4 p-8 relative overflow-hidden"
      style={{
        backgroundImage: 'url(/images/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {error && (
          <div
            className="text-black px-6 py-4 shadow-lg border-4 border-black"
            style={{
              backgroundColor: '#FF7043',
              clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
            }}
          >
            {error}
          </div>
        )}


        <div style={{ height: '80px' }} className="flex items-center justify-center relative w-full max-w-[640px]">
          {/* Beauty controls on the left */}
          <div
            className="absolute left-0 bottom-2 bg-[#2d1b0d] p-3 border-4 border-[#fdd017] shadow-[4px_4px_0px_#000000] flex flex-col gap-2 z-30 min-w-[150px] transition-all"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
              borderLeftColor: isBeautyEnabled ? '#FF7043' : '#fdd017'
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-black text-white uppercase tracking-wider">Beauty Cam</span>
              <button
                onClick={() => setIsBeautyEnabled(!isBeautyEnabled)}
                className={`w-10 h-5 rounded-full transition-all relative border-2 border-[#000000] ${isBeautyEnabled ? 'bg-[#FF7043]' : 'bg-[#444]'}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-md transition-all ${isBeautyEnabled ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>

            {isBeautyEnabled && (
              <div className="flex flex-col gap-1.5 opacity-100 transition-opacity">
                <div className="flex justify-between text-[10px] text-white font-black opacity-90">
                  <span className="tracking-widest">STRENGTH</span>
                  <span className="text-[#FF7043]">{beautyLevel}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={beautyLevel}
                  onChange={(e) => setBeautyLevel(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#444] rounded-full appearance-none cursor-pointer accent-[#FF7043]"
                />
                <div className="text-[8px] text-[#FF7043] font-bold uppercase tracking-tighter text-center pt-1 border-t border-[#3d2b1d] mt-1">
                  {beautyLevel <= 30 ? '✧ NATURAL GLOW ✧' : beautyLevel <= 70 ? '✧ RADIANT CLEAN ✧' : '✧ SUPREME LUSTER ✧'}
                </div>
              </div>
            )}
          </div>

          {isCountingDown && countdown !== null && countdown > 0 && (
            <div
              className="text-white font-bold border-4 border-white bg-black px-8 py-4 z-40"
              style={{
                fontSize: '48px',
                clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
                textShadow: '3px 3px 0px #F3CFEB'
              }}
            >
              {countdown}
            </div>
          )}
        </div>

        <div className="relative">
          <div
            className="absolute -right-48 bottom-0 z-20 w-48 h-48 animate-float pointer-events-none"
          >
            <img
              src={characters[assetIndex % characters.length]}
              alt="Character"
              className="w-full h-full object-contain"
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>

          <div
            className="bg-[#2d1b0d] bg-opacity-95 p-4 border-4 border-[#fdd017] shadow-[4px_4px_0px_#000000]"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))'
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`border-2 border-black ${isCameraOn ? 'block' : 'hidden'}`}
              style={{
                width: '640px',
                height: '480px',
                transform: 'scaleX(-1)',
                objectFit: 'cover'
              }}
            />

            {!isCameraOn && capturedImages.length === 0 && (
              <div
                className="w-full flex items-center justify-center border-2 border-black"
                style={{ width: '640px', height: '480px', backgroundColor: '#000000' }}
              >
                <p className="text-black text-sm font-bold px-4 text-center">
                  Camera Off
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Hidden canvas for capturing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Controls */}
        <div className="flex gap-4 flex-wrap justify-center">
          {!isCameraOn ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-4 text-white hover:opacity-80 font-bold text-sm border-4 border-[#fdd017] shadow-[4px_4px_0px_#000000] transition-all"
                style={{
                  backgroundColor: '#FF7043',
                  clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
                  imageRendering: 'pixelated'
                }}
              >
                Upload Photo
              </button>
              <button
                onClick={startCamera}
                className="px-8 py-4 text-white hover:opacity-80 font-bold text-sm border-4 border-[#fdd017] shadow-[4px_4px_0px_#000000] transition-all"
                style={{
                  backgroundColor: '#FF7043',
                  clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
                  imageRendering: 'pixelated'
                }}
              >
                Start Camera
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startCountdown}
                disabled={capturedImages.length >= 4 || isCountingDown}
                className="px-8 py-4 text-white hover:opacity-80 font-bold text-sm border-4 border-[#fdd017] shadow-[4px_4px_0px_#000000] transition-all disabled:opacity-50"
                style={{
                  backgroundColor: '#FF7043',
                  clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
                }}
              >
                {isCountingDown ? `${countdown}...` :
                  isBeautyEnabled && capturedImages.length > 0 ? 'AI BEAUTY APPLIED ✓' :
                    `Capture (${capturedImages.length}/4)`}
              </button>
              <button
                onClick={stopCamera}
                className="px-8 py-4 bg-[#333333] text-white hover:opacity-80 font-bold text-sm border-4 border-[#fdd017] shadow-[4px_4px_0px_#000000] transition-all"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
                }}
              >
                Stop Camera
              </button>
            </>
          )}
        </div>
      </div>

      {/* Captured photos sidebar */}
      {capturedImages.length > 0 && (
        <div
          className="w-80 bg-[#2d1b0d] bg-opacity-95 p-4 border-4 border-[#fdd017] shadow-[4px_4px_0px_#000000] overflow-y-auto"
          style={{
            clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))',
            maxHeight: 'calc(100vh - 4rem)'
          }}
        >
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">
                Photos ({capturedImages.length}/4)
              </h3>
              <button
                onClick={clearAllPhotos}
                className="px-3 py-2 text-white text-xs font-bold border-4 border-[#fdd017] shadow-[4px_4px_0px_#000000] hover:opacity-80 transition-all"
                style={{
                  backgroundColor: '#FF7043',
                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))'
                }}
              >
                Clear All
              </button>
            </div>

            {/* Next button */}
            <button
              onClick={goToEdit}
              className="w-full px-4 py-3 text-white font-bold text-sm border-4 border-[#fdd017] shadow-[4px_4px_0px_#000000] hover:opacity-80 transition-all"
              style={{
                backgroundColor: '#FF7043',
                clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
              }}
            >
              Next: Add Stickers
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {capturedImages.map((image, index) => (
              <div
                key={index}
                className="border-4 border-[#fdd017] shadow-[4px_4px_0px_#000000]"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
                }}
              >
                <img
                  src={image}
                  alt={`Captured ${index + 1}`}
                  className="w-full border-2 border-black"
                />
                <div className="flex gap-2 p-2 bg-[#3d2b1d]">
                  <a
                    href={image}
                    download={`anime-lens-photo-${index + 1}.png`}
                    className="flex-1 px-3 py-2 bg-[#444444] text-white text-xs font-bold border-4 border-[#fdd017] shadow-[4px_4px_0px_#000000] hover:opacity-80 text-center transition-all"
                    style={{
                      clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))'
                    }}
                  >
                    Download
                  </a>
                  <button
                    onClick={() => deletePhoto(index)}
                    className="flex-1 px-3 py-2 text-white text-xs font-bold border-4 border-[#fdd017] shadow-[4px_4px_0px_#000000] hover:opacity-80 transition-all"
                    style={{
                      backgroundColor: '#FF7043',
                      clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
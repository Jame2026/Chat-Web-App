
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, Check, RotateCcw, Image as ImageIcon } from 'lucide-react';
import getCroppedImg from '../utils/cropImage';

const ImageEditorModal = ({ isOpen, image, onCancel, onSave, aspect = 1, shape = 'round' }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleApply = async () => {
        try {
            const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
            onSave(croppedBlob);
        } catch (e) {
            console.error("Error cropping image:", e);
            alert("Failed to crop image. Please try again.");
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (e.target === e.currentTarget) onCancel();
                }}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(10, 11, 14, 0.95)',
                    backdropFilter: 'blur(20px)',
                    zIndex: 3500,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {/* Header */}
                <div style={{
                    width: '100%',
                    padding: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '12px',
                            background: 'rgba(59, 130, 246, 0.1)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center'
                        }}>
                            <ImageIcon size={20} color="#3b82f6" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: 'white', fontSize: '16px', fontWeight: '800' }}>Edit Image</h3>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '600' }}>Adjust crop & zoom</p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onCancel}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={20} />
                    </motion.button>
                </div>

                {/* Cropper Container */}
                <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '60vh',
                    maxHeight: '600px',
                    marginTop: '60px',
                }}>
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        cropShape={shape}
                        showGrid={false}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        style={{
                            containerStyle: {
                                backgroundColor: 'transparent',
                            },
                        }}
                    />
                </div>

                {/* Controls Area */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    style={{
                        width: '90%',
                        maxWidth: '450px',
                        padding: '32px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '32px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '28px',
                        marginTop: '40px',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                <ZoomIn size={14} /> Zoom Level
                            </div>
                            <span style={{ color: 'white', fontSize: '13px', fontWeight: '700', minWidth: '40px', textAlign: 'right' }}>
                                {Math.round(zoom * 100)}%
                            </span>
                        </div>

                        <div style={{ position: 'relative', height: '32px', display: 'flex', alignItems: 'center' }}>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.01}
                                value={zoom}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    setZoom(parseFloat(e.target.value));
                                }}
                                style={{
                                    width: '100%',
                                    height: '6px',
                                    borderRadius: '3px',
                                    appearance: 'none',
                                    background: 'rgba(255,255,255,0.1)',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    accentColor: '#3b82f6'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <motion.button
                            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onCancel}
                            style={{
                                flex: 1,
                                padding: '16px',
                                borderRadius: '18px',
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(255,255,255,0.15)',
                                color: 'white',
                                fontWeight: '700',
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <RotateCcw size={18} /> Cancel
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02, backgroundColor: '#4f46e5' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleApply}
                            style={{
                                flex: 1.5,
                                padding: '16px',
                                borderRadius: '18px',
                                backgroundColor: '#6366f1',
                                border: 'none',
                                color: 'white',
                                fontWeight: '800',
                                fontSize: '15px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)'
                            }}
                        >
                            <Check size={20} /> Save Changes
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ImageEditorModal;

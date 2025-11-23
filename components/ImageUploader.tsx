import React, { useState, useRef, useCallback, useEffect } from 'react';
// FIX: Imported `CheckCircleIcon` to resolve the "Cannot find name" error.
import { UploadIcon, XIcon, TagIcon, CheckCircleIcon } from './IconComponents';

type ViewKey = 'top' | 'side' | 'back';
type ImageFile = {
    id: string;
    file: File;
    preview: string;
}
type Tags = Record<ViewKey, string | null>; // Maps viewKey to image ID

interface ImageUploaderProps {
  onImagesChange: (files: { top: File | null; side: File | null; back: File | null; }) => void;
  isAnalyzing: boolean;
}

const VIEW_CONFIG: Record<ViewKey, { label: string; description: string }> = {
    top: { label: "Top", description: "From directly above your foot." },
    side: { label: "Side (Arch)", description: "Inside of your foot, showing the arch." },
    back: { label: "Back (Heel)", description: "From directly behind your heel." },
};

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesChange, isAnalyzing }) => {
    const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
    const [tags, setTags] = useState<Tags>({ top: null, side: null, back: null });
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const taggedFiles: { top: File | null; side: File | null; back: File | null; } = {
            top: null,
            side: null,
            back: null,
        };
        (Object.keys(tags) as ViewKey[]).forEach(viewKey => {
            const imageId = tags[viewKey];
            if (imageId) {
                const imageFile = imageFiles.find(img => img.id === imageId);
                if (imageFile) {
                    taggedFiles[viewKey] = imageFile.file;
                }
            }
        });
        onImagesChange(taggedFiles);
    }, [tags, imageFiles, onImagesChange]);

    const handleFiles = useCallback((files: FileList | null) => {
        if (!files) return;
        const newFiles: ImageFile[] = Array.from(files)
            .filter(file => file.type.startsWith('image/'))
            .slice(0, 3 - imageFiles.length) // Limit to 3 total images
            .map(file => ({
                id: `${file.name}-${file.lastModified}-${Math.random()}`,
                file,
                preview: URL.createObjectURL(file),
            }));

        setImageFiles(prev => [...prev, ...newFiles]);
    }, [imageFiles.length]);
    
    const removeImage = (idToRemove: string) => {
        setImageFiles(prev => prev.filter(img => img.id !== idToRemove));
        setTags(prevTags => {
            const newTags = { ...prevTags };
            (Object.keys(newTags) as ViewKey[]).forEach(key => {
                if (newTags[key] === idToRemove) {
                    newTags[key] = null;
                }
            });
            return newTags;
        });
    };
    
    const handleTag = (imageId: string, viewKey: ViewKey) => {
        setTags(prev => {
            const newTags = { ...prev };
            // Untag if it's already tagged with this view
            if (newTags[viewKey] === imageId) {
                newTags[viewKey] = null;
            } else {
                // Clear this tag from any other image
                (Object.keys(newTags) as ViewKey[]).forEach(key => {
                    if (newTags[key] === imageId) {
                        newTags[key] = null;
                    }
                });
                // Assign the new tag
                newTags[viewKey] = imageId;
            }
            return newTags;
        });
    };
    
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isAnalyzing) return;
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isAnalyzing) return;
        setDragActive(false);
        if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    };

    const ImageThumbnail: React.FC<{ image: ImageFile }> = ({ image }) => {
        const claimedView = (Object.keys(tags) as ViewKey[]).find(key => tags[key] === image.id);
        
        return (
            <div className="flex flex-col gap-3">
                <div className="relative aspect-square bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                    <img src={image.preview} alt="Foot preview" className="w-full h-full object-contain rounded-lg"/>
                    <button 
                        onClick={() => removeImage(image.id)} 
                        disabled={isAnalyzing}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                        aria-label="Remove image"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex justify-center gap-2">
                    {(Object.keys(VIEW_CONFIG) as ViewKey[]).map(key => {
                        const isTagged = claimedView === key;
                        const isDisabled = tags[key] !== null && tags[key] !== image.id;
                        return (
                            <button
                                key={key}
                                onClick={() => handleTag(image.id, key)}
                                disabled={isDisabled || isAnalyzing}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                                    isTagged 
                                    ? 'bg-sky-600 text-white' 
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isTagged && <CheckCircleIcon className="w-4 h-4" />}
                                {VIEW_CONFIG[key].label}
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    };
    
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-b-2xl shadow-lg w-full h-full flex flex-col min-h-[450px]">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Upload Foot Images</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
                Upload 1-3 photos of your foot. For best results, tag each photo with its view.
            </p>
            {imageFiles.length === 0 ? (
                <div
                    className={`flex-grow border-2 border-dashed rounded-lg text-center transition-all duration-300 flex flex-col items-center justify-center ${dragActive ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/50' : 'border-slate-300 dark:border-slate-600'} ${isAnalyzing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    onClick={() => !isAnalyzing && inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                        disabled={isAnalyzing}
                    />
                    <div className="flex flex-col items-center justify-center space-y-3 p-4">
                        <UploadIcon className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                        <p className="text-slate-600 dark:text-slate-400">
                            <span className="font-semibold text-sky-600 dark:text-sky-400">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">PNG, JPG or WEBP (max 3 images)</p>
                    </div>
                </div>
            ) : (
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {imageFiles.map(img => <ImageThumbnail key={img.id} image={img} />)}
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
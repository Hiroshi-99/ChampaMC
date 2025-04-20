import React, { useState, useEffect, useRef } from 'react';
import { Image, Upload, Check, AlertCircle, Trash2, Copy, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ImageFile {
  id: string;
  name: string;
  url: string;
  created_at: string;
  size: number;
  mime_type: string;
}

export default function ImageManager() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch images from the storage
  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // List all files in the rank-images bucket
      const { data, error } = await supabase
        .storage
        .from('payment-proofs')
        .list('ranks', {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      // Create URLs for each image
      const imageFiles: ImageFile[] = await Promise.all(
        (data || []).map(async (file) => {
          const { data: fileData } = await supabase
            .storage
            .from('payment-proofs')
            .getPublicUrl(`ranks/${file.name}`);

          return {
            id: file.id,
            name: file.name,
            url: fileData.publicUrl,
            created_at: file.created_at || new Date().toISOString(),
            size: file.metadata?.size || 0,
            mime_type: file.metadata?.mimetype || ''
          };
        })
      );

      setImages(imageFiles);
    } catch (err: any) {
      console.error('Error fetching images:', err);
      setError('Failed to load images. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      setError(null);
      setSuccess(null);

      // Upload each file
      for (const file of Array.from(files)) {
        // Generate a unique file name
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

        // Upload the file
        const { error } = await supabase
          .storage
          .from('payment-proofs')
          .upload(`ranks/${fileName}`, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;
      }

      // Refresh the image list
      await fetchImages();
      
      setSuccess('Image(s) uploaded successfully.');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle image deletion
  const handleDeleteImage = async (fileName: string) => {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }
    
    try {
      setError(null);
      setSuccess(null);
      
      const { error } = await supabase
        .storage
        .from('payment-proofs')
        .remove([`ranks/${fileName}`]);
        
      if (error) throw error;
      
      // Remove the image from the local state
      setImages(images.filter(img => img.name !== fileName));
      
      setSuccess('Image deleted successfully.');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting image:', err);
      setError(err.message || 'Failed to delete image. Please try again.');
    }
  };

  // Handle copying image URL to clipboard
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(
      () => {
        setSuccess('Image URL copied to clipboard.');
        setTimeout(() => setSuccess(null), 3000);
      },
      (err) => {
        console.error('Could not copy URL:', err);
        setError('Failed to copy URL to clipboard.');
      }
    );
  };

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-white">Loading images...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Manage Images</h2>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            multiple
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className={`flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition duration-200 cursor-pointer ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload size={16} />
                <span>Upload Images</span>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Error and success messages */}
      {error && (
        <div className="bg-red-500/20 p-3 rounded-md border border-red-500/50 mb-4 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-500" />
          <p className="text-white text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/20 p-3 rounded-md border border-green-500/50 mb-4 flex items-center gap-2">
          <Check size={16} className="text-green-500" />
          <p className="text-white text-sm">{success}</p>
        </div>
      )}

      {/* Images grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {images.length === 0 ? (
          <div className="col-span-full bg-gray-800 rounded-lg border border-gray-700 p-6 text-center">
            <Image size={48} className="text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400 mb-4">No images found.</p>
            <label
              htmlFor="image-upload"
              className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition duration-200 cursor-pointer"
            >
              <Upload size={16} />
              <span>Upload Your First Image</span>
            </label>
          </div>
        ) : (
          images.map((image) => (
            <div 
              key={image.id} 
              className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex flex-col"
            >
              <div className="relative aspect-video bg-gray-900 flex items-center justify-center">
                <img 
                  src={image.url} 
                  alt={image.name} 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="p-3 space-y-2 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-medium text-sm truncate" title={image.name}>
                      {image.name}
                    </h3>
                    <p className="text-gray-400 text-xs">
                      {formatFileSize(image.size)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleCopyUrl(image.url)}
                      className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      title="Copy URL"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteImage(image.name)}
                      className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={image.url}
                  readOnly
                  onClick={(e) => e.currentTarget.select()}
                  className="w-full text-xs px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 
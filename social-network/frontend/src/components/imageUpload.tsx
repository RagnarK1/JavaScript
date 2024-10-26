'use client';
import React, { ChangeEvent, useState } from 'react';

const ImageUploader = ({ labelText }: { labelText: string }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <label className='form-control'>
      <div className='label'>
        <span className='label-text'>{labelText}</span>
      </div>
      <input
        type='file'
        name='my_image'
        className='file-input w-full max-w-xs'
        accept='image/jpeg, image/png, image/gif'
        onChange={handleImageChange}
      />
      {selectedImage && (
        <div>
          <img
            src={selectedImage}
            alt='Selected'
            style={{ maxWidth: '100%', maxHeight: '400px' }}
          />
        </div>
      )}
    </label>
  );
};

export default ImageUploader;

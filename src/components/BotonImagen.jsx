// /src/components/BotonImagen.jsx
import React from 'react';

const BotonImagen = ({ src, alt, onClick, style }) => {
  return (
    <img
      src={src}
      alt={alt}
      loading="eager"
      decoding="async"
      onClick={onClick}
      style={{
        width: 300,
        height: 'auto',
        cursor: 'pointer',
        objectFit: 'contain',
        display: 'block',
        ...style,
      }}
    />
  );
};

export default BotonImagen;

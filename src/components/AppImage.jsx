import React, { useEffect, useState } from 'react';
import { DEFAULT_IMAGE_URL, resolveMediaUrl } from '../utils/media.js';

const AppImage = ({ src, alt, className, ...rest }) => {
  const [current, setCurrent] = useState(resolveMediaUrl(src));

  useEffect(() => {
    setCurrent(resolveMediaUrl(src));
  }, [src]);

  return (
    <img
      src={current}
      alt={alt || ''}
      className={className}
      onError={() => setCurrent(DEFAULT_IMAGE_URL)}
      {...rest}
    />
  );
};

export default AppImage;

import React from 'react';

const CompassIcon: React.FC = () => {
  
  const imageUrl = '/TripDiaryLogo.png'; 
  
  const style = {
    width: '393px',
    height: '369px',
    objectFit: 'contain' as const,
  };

  return (
    <img 
      src={imageUrl} 
      alt="TripDiary Logo - Compass" 
      style={style}
      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { 
        e.currentTarget.onerror = null; 
        e.currentTarget.src = 'https://placehold.co/393x369/cccccc/333333?text=Logo'; 
      }}
    />
  );
};

export default CompassIcon;
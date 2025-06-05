
import React from 'react';

interface AparatPlayerProps {
  videoHash: string;
  className?: string;
}

const AparatPlayer: React.FC<AparatPlayerProps> = ({ videoHash, className = "" }) => {
  return (
    <div className={`w-full ${className}`}>
      <style>{`
        .h_iframe-aparat_embed_frame {
          position: relative;
        }
        .h_iframe-aparat_embed_frame .ratio {
          display: block;
          width: 100%;
          height: auto;
        }
        .h_iframe-aparat_embed_frame iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
      `}</style>
      <div className="h_iframe-aparat_embed_frame">
        <span style={{ display: 'block', paddingTop: '57%' }}></span>
        <iframe 
          src={`https://www.aparat.com/video/video/embed/videohash/${videoHash}/vt/frame`}
          allowFullScreen={true}
          // @ts-ignore
          webkitallowfullscreen="true" 
          mozallowfullscreen="true"
          className="border-0"
        />
      </div>
    </div>
  );
};

export default AparatPlayer;

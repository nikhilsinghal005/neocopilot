// ContextWrapper.tsx
import React from 'react';
import { useChatContext } from '../../../features/chat/state/chatTypes';
import UploadedFileTags from './UploadedFileTags';

const ContextWrapper: React.FC = () => {
  const { uploadImage  } = useChatContext();

  return (
    <div>
    {uploadImage.length > 0 &&(
        <div className="context-wrapper w-full flex flex-row items-center px-1 my-1" style={{ height: '18px' }}>
          <UploadedFileTags />
        </div>
      )}
  </div>
  );
};

export default ContextWrapper;

// InputBarUtils.ts
import { useEffect } from 'react';
import { EditorOpenFileList, UploadedImage } from '../../../shared/types/Message';

// Interface for the custom hook's props
interface UseHandleIncomingMessagesProps {
  setInput: (input: string) => void;
  _setOpenEditorFilesList: (files: EditorOpenFileList[]) => void;
}

// Custom hook to handle incoming messages from VS Code
export const useHandleIncomingMessages = ({
  setInput,
  _setOpenEditorFilesList,
}: UseHandleIncomingMessagesProps) => {
  // Handle 'insert_messages' command
  useEffect(() => {
    const handleInsertMessages = (event: MessageEvent) => {
      if (event.data.command === 'insert_messages') {
        console.log('Received chat message from VS Code:', event.data);
        setInput(event.data.inputText || '');
      }
    };

    window.addEventListener('message', handleInsertMessages);

    return () => {
      window.removeEventListener('message', handleInsertMessages);
    };
  }, [setInput]);


  // Handle 'editor_open_files_list_update_event' command
  useEffect(() => {
    const handleOpenFilesListUpdate = (event: MessageEvent) => {
      if (event.data.command === 'editor_open_files_list_update_event') {
        console.log('List of Files Received:', event.data);
        const updatedOpenFilesList = event.data.openFiles;
        _setOpenEditorFilesList(updatedOpenFilesList);
      }
    };

    window.addEventListener('message', handleOpenFilesListUpdate);

    return () => {
      window.removeEventListener('message', handleOpenFilesListUpdate);
    };
  }, [_setOpenEditorFilesList]);
};

// Sanitize input to prevent XSS attacks
export const sanitizeInput = (input: string): string => {
  return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

// Handle send button click
export const handleSendClick = (
  isTyping: boolean,
  setWarningMessage: React.Dispatch<React.SetStateAction<string>>,
  setIsInterrupted: React.Dispatch<React.SetStateAction<boolean>>,
  sanitizeInputFunc: (input: string) => string,
  input: string,
  setInput: (input: string) => void,
  handleSendMessage: () => void,
  setIsTyping: (isTyping: boolean) => void
) => {
  if (isTyping) {
    setWarningMessage('Please wait, the assistant is still responding.');
    setTimeout(() => setWarningMessage(''), 3000);
    return;
  }
  setIsInterrupted(false);
  const sanitizedInput = sanitizeInputFunc(input);
  setInput(sanitizedInput);
  handleSendMessage();
  setIsTyping(true); // Set typing to true when a message is sent
};

// Handle stop button click
export const handleStopClickFunction = (
  setIsTyping: (isTyping: boolean) => void,
  setIsInterrupted: (isInterrupted: boolean) => void
) => {
  setIsTyping(false); // Set typing to false to stop the process
  setIsInterrupted(true);
  // Additional logic to stop the ongoing process can be added here
};

// Handle code insert button click
export const handleCodeInsertClickFunction = (vscode: { postMessage: (message: { command: string, data: { title: string, message: string } }) => void }) => {
  vscode.postMessage({
    command: 'showInfoPopup',
    data: {
      title: 'Insert Code',
      message: 'Neo is currently developing this feature and it will be available shortly.',
    },
  });
};

// Handle removing a tag/context


export const handleImageUpload = (
  vscode: { postMessage: (message: { command: string, data?: { title: string, message: string }, message?: string, chatId?: string }) => void },
  uploadImages: UploadedImage[],
  setUploadImage: (images: UploadedImage[]) => void,
  chatId: string,
) => {
  console.log('Uploading image...');

  // Check if there are already 2 images uploaded
  if (uploadImages.length >= 2) {
    vscode.postMessage({
      command: 'showInfoPopup',
      data: {
        title: 'Image Upload',
        message: 'You can only upload up to 2 images.',
      },
    });
    return;
  }

  vscode.postMessage({
    command: 'upload_image',
    message: 'Please upload an image.',
    chatId: chatId,
  });

  // Listen for messages from the webview
  window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.command) {
      case 'receive_image_message':
        {
          const { uploadedImages: newImages } = message.data; // Renamed to avoid confusion
          console.log('Received uploaded images:', newImages);
          // Filter out already uploaded images
          const existingImagePaths = new Set(uploadImages.map(img => img.filePath));
          const filteredImages = newImages.filter((newImage: UploadedImage) => 
            !existingImagePaths.has(newImage.filePath)
          );
          // Limit to 2 images
          const imagesToAdd = filteredImages.slice(0, 2 - uploadImages.length);
          if (imagesToAdd.length > 0) {
            setUploadImage([...uploadImages, ...imagesToAdd]);
            console.log('Uploaded images:', imagesToAdd);
          } else {
            console.log('No new images to upload or already have 2 images.');
          }
          if (filteredImages.length < newImages.length) {
            console.log('Some images were already uploaded:', 
              newImages.filter((newImage: UploadedImage) => existingImagePaths.has(newImage.filePath))
            );
            vscode.postMessage({
              command: 'showInfoPopup',
              data: {
                title: 'Image Upload',
                message: 'Some images were already uploaded.',
              },
            });
          }
        }
        break;
    }
  });
}

//handle remove image
export const handleRemoveImage = (
  filePath: string,
  uploadImage: UploadedImage[],
  setUploadImage: (images: UploadedImage[]) => void
) => {
  const updatedImages = uploadImage.filter((image) => image.filePath !== filePath);
  setUploadImage(updatedImages);
};


export const handlePaste = (
  e: React.ClipboardEvent,
  setUploadImage: (images: UploadedImage[]) => void,
  chatId: string,
  vscode: { postMessage: (message: { command: string, data?: { title: string, message: string }, chatId?: string, images?: UploadedImage[] }) => void },
  uploadImage: UploadedImage[],
  setText?: (text: string) => void
) => {
  e.preventDefault(); // Prevent default paste behavior
  
  const items = e.clipboardData?.items;
  if (!items) {return;}

  // Filter out image items from the clipboard
  const imageItems = Array.from(items).filter(
    item => item.type.indexOf('image') !== -1
  );

  // If there are image items, handle the image paste and ignore any text data.
  if (imageItems.length > 0) {
    if (uploadImage.length >= 2) {
      vscode.postMessage({
        command: 'showInfoPopup',
        data: {
          title: 'Image Upload',
          message: 'You can only upload up to 2 images.',
        },
      });
      return;
    }

    const item = imageItems[0];
    const blob = item.getAsFile();
    
    if (!blob) {return;}

    if (blob.size > 5 * 1024 * 1024) {
      vscode.postMessage({
        command: 'showInfoPopup',
        data: {
          title: 'Image Upload',
          message: 'Pasted image is too large. Please use an image smaller than 5MB.',
        },
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {return;}
      const base64Data = reader.result.split(',')[1];
      const fileType = blob.type.split('/')[1];
      const timestamp = Date.now();
      const fileName = blob.name || `pasted-image-${timestamp}.${fileType}`;
      const pastedImage: UploadedImage = {
        fileName: fileName,
        filePath: `pasted-image-${timestamp}`,
        fileType: fileType,
        fileContent: base64Data,
        isActive: true,
        isManuallyAddedByUser: true,
      };
      const allImages = uploadImage.length > 0 ? [...uploadImage, pastedImage] : [pastedImage];
      setUploadImage(allImages);
      vscode.postMessage({
        command: 'copy_paste_image',
        chatId: chatId,
        images: allImages
      });
    };
    reader.readAsDataURL(blob);
  } else {
    const textData = e.clipboardData?.getData('text');
    if (textData && setText) {
      setText(textData);
    }
  }
};

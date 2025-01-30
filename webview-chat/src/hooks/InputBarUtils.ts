// InputBarUtils.ts
import { useEffect } from 'react';
import { EditorOpenFileList, CurrentFileContext, UploadedImage } from '../types/Message';

// Interface for the custom hook's props
interface UseHandleIncomingMessagesProps {
  setInput: (input: string) => void;
  attachedContext: CurrentFileContext[];
  setAttachedContext: (contexts: CurrentFileContext[]) => void;
  openEditorFilesList: EditorOpenFileList[];
  setOpenEditorFilesList: (files: EditorOpenFileList[]) => void;
  vscode: any;
}

// Custom hook to handle incoming messages from VS Code
export const useHandleIncomingMessages = ({
  setInput,
  attachedContext,
  setAttachedContext,
  openEditorFilesList,
  setOpenEditorFilesList,
  vscode,
}: UseHandleIncomingMessagesProps) => {
  // Handle 'insert_messages' command
  useEffect(() => {
    const handleInsertMessages = (event: MessageEvent) => {
      if (event.data.command === 'insert_messages') {
        // console.log('Received chat message from VS Code:', event.data);
        setInput(event.data.inputText || '');
      }
    };

    window.addEventListener('message', handleInsertMessages);

    return () => {
      window.removeEventListener('message', handleInsertMessages);
    };
  }, [setInput]);

  // Handle 'editor_changed_context_update_event' command
  useEffect(() => {
    const handleEditorChangedContext = (event: MessageEvent) => {
      if (event.data.command === 'editor_changed_context_update_event') {
        const { action, currentSelectedFileName, currentSelectedFileRelativePath, languageId } = event.data;

        if (action === 'user_opened_in_editor') {
          // Filter contexts manually added by the user
          const updatedContext = attachedContext.filter((context) => context.isManuallyAddedByUser);

          // Check if the file is already attached
          const isFileAlreadyAttached = attachedContext.some(
            (context) =>
              context.fileName === currentSelectedFileName &&
              context.filePath === currentSelectedFileRelativePath
          );

          if (isFileAlreadyAttached) {
            // Update selection status
            setAttachedContext(
              attachedContext.map((context) =>
                context.fileName === currentSelectedFileName &&
                context.filePath === currentSelectedFileRelativePath
                  ? { ...context, isSelected: true }
                  : { ...context, isSelected: false }
              )
            );
          } else {
            // Add new context
            const newContext: CurrentFileContext = {
              fileName: currentSelectedFileName,
              filePath: currentSelectedFileRelativePath,
              languageId: languageId,
              isActive: true,
              isOpened: true,
              isSelected: true,
              isManuallyAddedByUser: false,
              isAttachedInContextList: true,
            };
            setAttachedContext([newContext, ...updatedContext]);
          }
        } else if (action === 'user_opened_unsupported_file_in_editor') {
          // Deselect all contexts
          const updatedContext = attachedContext.filter((context) => context.isManuallyAddedByUser);
          setAttachedContext(updatedContext.map((context) => ({ ...context, isSelected: false })));
        } else if (action === 'remove_all_selected') {
          // Remove all contexts
          setAttachedContext([]);
        }
      }
    };

    window.addEventListener('message', handleEditorChangedContext);

    return () => {
      window.removeEventListener('message', handleEditorChangedContext);
    };
  }, [attachedContext, setAttachedContext]);

  // Handle 'editor_open_files_list_update_event' command
  useEffect(() => {
    const handleOpenFilesListUpdate = (event: MessageEvent) => {
      if (event.data.command === 'editor_open_files_list_update_event') {
        // console.log('List of Files Received:', event.data);
        const updatedOpenFilesList = event.data.openFiles.filter(
          (file: EditorOpenFileList) => !attachedContext.some((context) => context.filePath === file.filePath)
        );
        setOpenEditorFilesList(updatedOpenFilesList);
      }
    };

    window.addEventListener('message', handleOpenFilesListUpdate);

    return () => {
      window.removeEventListener('message', handleOpenFilesListUpdate);
    };
  }, [attachedContext, setOpenEditorFilesList]);
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
export const handleCodeInsertClickFunction = (vscode: any) => {
  vscode.postMessage({
    command: 'showInfoPopup',
    data: {
      title: 'Insert Code',
      message: 'Neo is currently developing this feature and it will be available shortly.',
    },
  });
};

// Handle removing a tag/context
export const handleRemoveTagFunction = (
  filePath: string,
  attachedContext: CurrentFileContext[],
  setAttachedContext: (contexts: CurrentFileContext[]) => void,
  openEditorFilesList: EditorOpenFileList[],
  setOpenEditorFilesList: (files: EditorOpenFileList[]) => void
) => {
  const removedFile = attachedContext.find((context) => context.filePath === filePath);
  if (removedFile) {
    setOpenEditorFilesList([
      ...openEditorFilesList,
      {
        fileName: removedFile.fileName,
        filePath: removedFile.filePath,
        languageId: removedFile.languageId,
        isActive: removedFile.isActive,
        isOpened: removedFile.isOpened,
        isSelected: removedFile.isSelected,
      },
    ]);
  }
  const updatedAttachedContext = attachedContext.filter((context) => context.filePath !== filePath);
  setAttachedContext(updatedAttachedContext);
};

// Handle clicking on a list item to attach a file
export const handleListItemClickFunction = (
  item: EditorOpenFileList,
  setSelectedItem: (item: string | null) => void,
  setShowList: (show: boolean) => void,
  attachedContext: CurrentFileContext[],
  openEditorFilesList: EditorOpenFileList[],
  setOpenEditorFilesList: (files: EditorOpenFileList[]) => void,
  setAttachedContext: (contexts: CurrentFileContext[]) => void,
  vscode: any
) => {
  setSelectedItem(item.fileName);
  setShowList(false);

  if (attachedContext.length < 3) { // Allow up to 3 files
    const updatedOpenFilesList = openEditorFilesList.filter((file) => file.filePath !== item.filePath);
    setOpenEditorFilesList(updatedOpenFilesList);

    const newContext: CurrentFileContext = {
      fileName: item.fileName,
      filePath: item.filePath,
      languageId: item.languageId,
      isActive: item.isActive,
      isOpened: item.isOpened,
      isSelected: item.isSelected,
      isAttachedInContextList: true,
      isManuallyAddedByUser: true,
    };

    setAttachedContext([...attachedContext, newContext]);
  } else {
    // Notify user about the limit
    vscode.postMessage({
      command: 'showInfoPopup',
      data: {
        title: 'Context Information',
        message: 'You can only attach up to 3 files at a time.',
      },
    });
  }

};

export const handleImageUpload = (
  vscode: any,
  uploadImages: UploadedImage[],
  setUploadImage: (images: UploadedImage[]) => void,
  chatId: string,
) => {
  // console.log('Uploading image...');

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
          // console.log('Received uploaded images:', newImages);
          // Filter out already uploaded images
          const existingImagePaths = new Set(uploadImages.map(img => img.filePath));
          const filteredImages = newImages.filter((newImage: UploadedImage) => 
            !existingImagePaths.has(newImage.filePath)
          );
          // Limit to 2 images
          const imagesToAdd = filteredImages.slice(0, 2 - uploadImages.length);
          if (imagesToAdd.length > 0) {
            setUploadImage([...uploadImages, ...imagesToAdd]);
            // console.log('Uploaded images:', imagesToAdd);
          } else {
            // console.log('No new images to upload or already have 2 images.');
          }
          if (filteredImages.length < newImages.length) {
            // console.log('Some images were already uploaded:', 
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








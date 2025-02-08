// InputBarUtils.ts
import { useEffect } from 'react';
import { EditorOpenFileList, CurrentFileContext, UploadedImage,FunctionOutline } from '../types/Message';

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
        console.log('Received chat message from VS Code:', event.data);
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
        console.log('List of Files Received:', event.data);
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
      isAttachedInText: false
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

// Handle clicking on a list item from @ function to attach a file
export const handleAttachItemClickFunction = (
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
      isManuallyAddedByUser: false,
      isAttachedInText: true,
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

//Handling attach function
export const handleFunctionSelect = (
  selectedFunction: FunctionOutline,
  item: EditorOpenFileList,
  textareaRef: React.RefObject<HTMLTextAreaElement>,
  value: string,
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void,
  attachedContext: CurrentFileContext[],
  setAttachedContext: React.Dispatch<React.SetStateAction<CurrentFileContext[]>>,
  setShowFunctionList: (show: boolean) => void,
  setShowDropdown: (show: boolean) => void,
  vscode: any
) => {
  console.log('Selected function:', selectedFunction);
  const cursorPosition = textareaRef.current?.selectionStart || 0;
  const textBeforeCaret = value.slice(0, cursorPosition);
  const lastAtSymbol = textBeforeCaret.lastIndexOf('@');
  const newValue = `${textBeforeCaret.slice(0, lastAtSymbol)}@${selectedFunction.name} ${value.slice(cursorPosition)}`;
  const event = { target: { value: newValue } } as React.ChangeEvent<HTMLTextAreaElement>;
  onChange(event);

  if (attachedContext.length < 3) {
    const newContext: CurrentFileContext = {
      fileName: item.fileName,
      filePath: item.filePath,
      languageId: item.languageId,
      isActive: true,
      isOpened: true,
      isSelected: true,
      isAttachedInContextList: true,
      isManuallyAddedByUser: false,
      isAttachedInText: true,
      FunctionAttached: selectedFunction,
    };

    setAttachedContext((prevContext: CurrentFileContext[]) => {
      const functionExists = prevContext.some(
        context => context.FunctionAttached?.name === selectedFunction.name
      );
      
      if (functionExists) {
        return prevContext;
      }
      
      const newContexts = [...prevContext, newContext];
      return newContexts;
    });
    console.log('Attached context:', newContext);
  } else {
    vscode.postMessage({
      command: 'showInfoPopup',
      data: {
        title: 'Context Information',
        message: 'You can only attach up to 3 items at a time.',
      },
    });
  }

  setShowFunctionList(false);
  setShowDropdown(false);
};

export const handleImageUpload = (
  vscode: any,
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

export const handleGetOutline = (vscode: any): Promise<FunctionOutline[]> => {
  return new Promise((resolve, reject) => {
    // Handler function for the response
    const handleOutlineResponse = (event: MessageEvent) => {
      if (event.data.command === 'editor_functions_response') {
        window.removeEventListener('message', handleOutlineResponse);
        resolve(event.data.functions);
      }
      if (event.data.command === 'editor_functions_error') {
        window.removeEventListener('message', handleOutlineResponse);
        reject(new Error(event.data.error));
      }
    };
    window.addEventListener('message', handleOutlineResponse);
    vscode.postMessage({
      command: 'get_outline_details'
    });
    setTimeout(() => {
      window.removeEventListener('message', handleOutlineResponse);
      reject(new Error('Timeout waiting for outline details'));
    }, 5000);
  });
};

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
  vscode: any,
  uploadImage: UploadedImage[],
  setText?: (text: string) => void
) => {
  e.preventDefault(); // Prevent default paste behavior
  
  const items = e.clipboardData?.items;
  if (!items) return;

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
    
    if (!blob) return;

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
      if (typeof reader.result !== 'string') return;
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

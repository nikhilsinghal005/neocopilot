
export function isNullOrEmptyOrWhitespace(inputString: string | null | undefined): boolean {
    return inputString === null || (inputString?.trim() === '');
  }
  
  export function checkFileNameForCodeCompletion(fileName: string | null | undefined): boolean {
    // List of programming language extensions for which code completion is supported
    const supportedExtensions = [
        '.js', '.ts', '.java', '.py', '.c', '.cpp', '.cs', '.rb', '.php', '.html', '.css'
    ];
    return supportedExtensions.some(extension => fileName?.endsWith(extension));
  }
  
  export function notSupportedFiles(fileName: string | null | undefined): boolean {
    // console.log("fileName", fileName)
    const commonIncludedFileList = ["requirements.txt", "package.json", "package-lock.json", "config.json", ".env"];
    if (fileName === undefined || fileName === null) {
      return true;
    }
    if (commonIncludedFileList.includes(fileName)) {
      // console.log("includes_file_name")
      return false;
    }
    const notSupportedExtensions = ['.csv', '.log', '.json', '.xml', '.md', '.txt', '.sql', '.html', '.xlsx', '.pdf'];
    return notSupportedExtensions.some(extension => fileName.endsWith(extension));
  }
  
  
  export function modifySuggestion(mainString: string, tempString: string, sliceLength: number): string {
    // Function to modify suggestion string
    // This function is used to modify the suggestion string to remove the part of the string
    // that is already typed by the user.
    // For example, if the user has typed "import" and the suggestion is "import os",
    // then the suggestion will be modified to "os".
    // This is done to avoid showing suggestions that are already typed by the user.
    // The sliceLength parameter is used to limit the length of the modified suggestion.
    // This is done to avoid showing suggestions that are too long.
    if (mainString.endsWith(tempString) && mainString!=tempString) {
        const endIndex = mainString.length - tempString.length;
        const modifiedMainSuggestion = mainString.slice(0, endIndex);
        if (sliceLength > 0 && sliceLength <= modifiedMainSuggestion.length) {
            const slice = modifiedMainSuggestion.slice(-sliceLength);
            return slice + tempString;
        }else{
            return "";
        }
    }else{
      return "";
    }
  }

// Check for special characters and handle accordingly
export function handleAddedSpecialCharacters(mianString: string, tempString: string, updatedText: string): string {

    const closeChar = getMatchingCloseChar(updatedText[0])
    if (updatedText[1] !== closeChar) {
        return ""
    }   
    const closeCharIndex = findLastMatchingParenthesis(tempString, 0);
    if (closeCharIndex === -1){
        console.log("No matching close char found");
        return "";
    }
    const beforeInsert = tempString.substring(1, closeCharIndex);
    const afterInsert = tempString.substring(closeCharIndex + 1);
    tempString = beforeInsert + afterInsert;
    return tempString;
}

function getMatchingCloseChar(openChar: string): string {
    switch (openChar) {
        case '(': return ')';
        case '{': return '}';
        case '[': return ']';
        case '"': return '"';
        case "'": return "'";
        default: return '';
    }
}

function findLastMatchingParenthesis(code: string, startIndex: number): number {
    const stack: number[] = [];
    const openToClose: Record<string, string> = { '(': ')', '{': '}', '[': ']', "'": "'", '"': '"' };
    const closeToOpen: Record<string, string> = { ')': '(', '}': '{', ']': '[', "'": "'", '"': '"' };

    const startChar = code[startIndex];
    if (!(startChar in openToClose || startChar in closeToOpen)) {
        return -1; // Not a parenthesis or quote
    }

    const isStartCharOpen = startChar in openToClose;
    const matchingChar = isStartCharOpen ? openToClose[startChar] : closeToOpen[startChar];

    if (startChar === "'" || startChar === '"') {
        // Special handling for quotes
        for (let i = code.length - 1; i > startIndex; i--) {
            if (code[i] === startChar && code[i - 1] !== '\\') {
                return i;
            }
        }
    } else if (isStartCharOpen) {
        // Traverse forward to find the matching closing parenthesis
        for (let i = startIndex; i < code.length; i++) {
            if (code[i] === startChar) {
                stack.push(i);
            } else if (code[i] === matchingChar) {
                stack.pop();
                if (stack.length === 0) {
                    // Continue traversing to find the last match
                    let lastIndex = i;
                    for (let j = i + 1; j < code.length; j++) {
                        if (code[j] === startChar) {
                            stack.push(j);
                        } else if (code[j] === matchingChar) {
                            stack.pop();
                            if (stack.length === 0) {
                                lastIndex = j;
                            }
                        }
                    }
                    return lastIndex;
                }
            }
        }
    } else {
        // Traverse backward to find the matching opening parenthesis
        for (let i = startIndex; i >= 0; i--) {
            if (code[i] === startChar) {
                stack.push(i);
            } else if (code[i] === matchingChar) {
                stack.pop();
                if (stack.length === 0) {
                    // Continue traversing to find the last match
                    let lastIndex = i;
                    for (let j = i - 1; j >= 0; j--) {
                        if (code[j] === startChar) {
                            stack.push(j);
                        } else if (code[j] === matchingChar) {
                            stack.pop();
                            if (stack.length === 0) {
                                lastIndex = j;
                            }
                        }
                    }
                    return lastIndex;
                }
            }
        }
    }
    return -1; // No match found
}

export function getDeletedText(
    fullText: string,
    startLine: number,
    startCharacter: number,
    endLine: number,
    endCharacter: number
    ): string {

    // Split the full text into lines
    const lines = fullText.split('\n');

    // Get the part of the text that was deleted
    let deletedText = '';
    if (startLine === endLine) {
        // Deletion within a single line
        deletedText = lines[startLine].substring(startCharacter, endCharacter);
    } else {
        // Deletion spans multiple lines
        deletedText += lines[startLine].substring(startCharacter) + '\n';
        for (let i = startLine + 1; i < endLine; i++) {
            deletedText += lines[i] + '\n';
        }
        deletedText += lines[endLine].substring(0, endCharacter);
    }

    return deletedText;
}

export function removeSubstringFromEnd(str: string, subStr: string): string {
    if (str.endsWith(subStr)) {
      const newLength = str.length - subStr.length;
      return str.substring(0, newLength);
    }
    return str;
}

export function findFirstMatch(mainListSuggestion: string[], mainSuggestion: string, subStr: string): string {
    // remove main suggestion from mainSuggestionList
    if (mainSuggestion) {
      mainListSuggestion = mainListSuggestion.filter(item => item !== mainSuggestion);
    }
    
    for (let item of mainListSuggestion) {
      if (item.startsWith(subStr)) {
        return item;
      }
    }
    return '';
  }
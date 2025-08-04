export function debounce(func: () => void, delay: number): () => void {
  let timer: NodeJS.Timeout;

  return () => {
    clearTimeout(timer); // Clear any existing timer
    timer = setTimeout(() => func(), delay); // Set a new timer
  };
}

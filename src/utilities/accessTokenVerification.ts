export function verifyAccessToken(token: string) {
  return new Promise((resolve, reject) => {
      fetch('http://localhost:5000/verify-token', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`  // Sending token as Bearer in the Authorization header
          },
          // No need to send token in the body
      })
      .then(response => response.json())
      .then(data => {
          if (data.isValid) {
              resolve(true);
          } else {
              resolve(false);
          }
      })
      .catch(error => {
          reject(error);
      });
  });
}

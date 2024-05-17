export function verifyAccessToken(token: string): Promise<boolean> {
    return fetch('https://api.vidyuthdatalabs.com/verify-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.isValid) {
        console.log("Token is Verified");
        return true;
      } else {
        console.log("Token is Not Verified");
        return false;
      }
    })
    .catch(error => {
      console.log("Error in Verifying Token", error);
      return false;  // Resolve to false on any error
    });
  }
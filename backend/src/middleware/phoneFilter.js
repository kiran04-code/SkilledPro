const filterPhoneNumber = (text) => {
  if (!text) return { blocked: false };

  // Allow standard system-generated location sharing
  // Must match exactly: [LOCATION] https://www.google.com/maps?q=lat,lng
  if (/^\[LOCATION\] https:\/\/www\.google\.com\/maps\?q=-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(text)) {
    return { blocked: false };
  }

  const normalized = text.toLowerCase();

  const restrictedKeywords = [
    'call me', 'contact me', 'whatsapp', 'phone number', 'mobile number', 
    'ring me', 'text me', 'ping me on', 'my number', 'reach me at', 'call on', 'whatsapp me'
  ];

  for (const keyword of restrictedKeywords) {
    if (normalized.includes(keyword)) {
      return { blocked: true, reason: 'Messages containing contact requests or keywords (like "call me", "whatsapp") are not allowed.' };
    }
  }

  // Replace spelled-out numbers with digits
  const numberWords = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9'
  };

  let numericText = normalized;
  for (const [word, digit] of Object.entries(numberWords)) {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    numericText = numericText.replace(regex, digit);
  }

  // Remove all characters except digits
  const justDigits = numericText.replace(/\D/g, '');

  // A typical phone number contains 10-14 digits.
  // Check for 10 or more digits scattered overall or a cluster.
  const phonePattern = /(?:\d\s*[\-\.,_a-zA-Z]*\s*){10,14}/;

  if (phonePattern.test(numericText) || justDigits.length >= 10) {
    return { blocked: true, reason: 'Sharing phone numbers or contact details is not allowed.' };
  }

  return { blocked: false };
};

module.exports = { filterPhoneNumber };
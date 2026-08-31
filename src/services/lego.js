// Rebrickable set numbers use a "-1" suffix for the primary edition (e.g. "75192-1").
export const normalizeLegoSetId = (setId) => (/-\d+$/.test(setId) ? setId : `${setId}-1`);

// Rebrickable's set-image CDN is public and needs no API key or account.
export const getLegoSetImageUrl = (setId) =>
  `https://cdn.rebrickable.com/media/sets/${normalizeLegoSetId(setId.trim().toLowerCase())}.jpg`;

// Loads the CDN image to confirm the set number is real before saving it.
export const lookupLegoSetImage = (setId) =>
  new Promise((resolve, reject) => {
    const trimmed = setId?.trim();
    if (!trimmed) {
      reject(new Error('Enter a Lego set ID first.'));
      return;
    }

    const normalizedSetId = normalizeLegoSetId(trimmed);
    const imageUrl = getLegoSetImageUrl(trimmed);
    const img = new Image();
    img.onload = () => resolve({ setId: normalizedSetId, imageUrl });
    img.onerror = () => reject(new Error(`No Lego set found for "${setId}". Double-check the set number.`));
    img.src = imageUrl;
  });

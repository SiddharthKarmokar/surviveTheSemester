import { performUserSearch } from '../services/searchService.js';

export const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.id;

    if (!q || typeof q !== 'string' || q.trim() === '') {
      return res.status(200).json({ results: [] });
    }
    const searchResults = await performUserSearch(currentUserId, q.trim());

    res.status(200).json({ results: searchResults });
  } catch (error) {
    console.error("User Search Error:", error);
    res.status(500).json({ message: "An error occurred while searching for users" });
  }
};

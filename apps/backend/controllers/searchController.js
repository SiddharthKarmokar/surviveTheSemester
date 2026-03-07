import { performUserSearch } from '../services/searchService.js';

export const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.id;
    const normalizedQuery = typeof q === 'string' ? q.trim() : '';

    if (!normalizedQuery) {
      return res.status(200).json({ results: [] });
    }

    const searchResults = await performUserSearch(currentUserId, normalizedQuery);

    res.status(200).json({ results: searchResults });
  } catch (error) {
    if (error?.message === 'Invalid user id') {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    console.error("User Search Error:", error);
    res.status(500).json({ message: "An error occurred while searching for users" });
  }
};

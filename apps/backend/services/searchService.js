import { prisma } from '../prisma/prisma.js';

export const performUserSearch = async (currentUserId, searchQuery) => {
  const currentUser = await prisma.users.findUnique({
    where: { id: currentUserId },
    select: { friendlist: true, sentRequests: true, receivedRequests: true }
  });

  if (!currentUser) throw new Error("User not found");

  const excludeIds = [
    { $oid: currentUserId }
  ];

  const currentUserConnections = currentUser.friendlist.map(id => ({ $oid: id }));
  const currentUserSentRequests = currentUser.sentRequests;
  const currentUserReceivedRequests = currentUser.receivedRequests;

  const sanitizedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexPattern = `^${sanitizedQuery}`;
  const matchConditions = [];
  matchConditions.push({ name: { $regex: regexPattern, $options: "i" } });
  
  if (searchQuery.includes('@')) {
    matchConditions.push({ email: { $regex: regexPattern, $options: "i" } });
  }

  const rawResults = await prisma.users.aggregateRaw({
    pipeline: [
      {
        $match: {
          _id: { $nin: excludeIds },
          $or: matchConditions
        }
      },
      {
        $addFields: {
          isConnection: {
            $in: ["$_id", currentUserConnections]
          },
          mutualConnectionsCount: {
            $size: {
              $setIntersection: [
                { $ifNull: ["$friendlist", []] },
                currentUserConnections
              ]
            }
          }
        }
      },
      {
        $sort: {
          isConnection: -1,
          mutualConnectionsCount: -1,
          name: 1
        }
      },
      {
        $limit: 20
      },
      {
        $project: {
          _id: 0,
          id: { $toString: "$_id" },
          name: 1,
          email: 1,
          interest: 1,
          isConnection: 1,
          mutualConnectionsCount: 1
        }
      }
    ]
  });

  // Map to include request statuses
  const finalResults = rawResults.map(user => {
    const isSentRequest = currentUserSentRequests.includes(user.id);
    const isReceivedRequest = currentUserReceivedRequests.includes(user.id);
    return {
      ...user,
      isSentRequest,
      isReceivedRequest
    };
  });

  return finalResults;
};

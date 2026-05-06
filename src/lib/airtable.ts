// Barrel file: re-exports all Airtable helpers from per-domain modules.
// External imports still use `from "@/lib/airtable"` — internal modules
// are located in lib/airtable/* split by domain (Q-2 audit refactor).
export type { UserRecord } from "./airtable/users";
export {
  createUser,
  getUserByEmail,
  getUserById,
  getUsersByIds,
  listDevs,
} from "./airtable/users";

export type { FeedbackRecord, FeedbackWithCreator } from "./airtable/feedbacks";
export {
  assignFeedback,
  createFeedback,
  deleteFeedback,
  getFeedbackById,
  incrementVoteCount,
  listBacklogFeedbacks,
  listFeedbacks,
  removeFromBacklog,
  sendToBacklog,
  setFeedbackStatus,
  updateFeedback,
} from "./airtable/feedbacks";

export type { VoteRecord } from "./airtable/votes";
export { createVote, findVote } from "./airtable/votes";

export type {
  NotificationRecord,
  NotificationWithFeedback,
} from "./airtable/notifications";
export {
  deleteAllNotifications,
  deleteNotificationForFeedback,
  listNotifications,
  upsertNotification,
} from "./airtable/notifications";

export type { CommentRecord, CommentWithAuthor } from "./airtable/comments";
export { createComment, listComments } from "./airtable/comments";

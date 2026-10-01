import { query } from '../config/db.js';

export const Vote = {
  async getUserVote(userId, contentId, contentType) {
    const { rows } = await query(
      'SELECT vote_type FROM votes WHERE user_id = $1 AND content_id = $2 AND content_type = $3',
      [userId, contentId, contentType]
    );
    return rows.length ? rows[0].vote_type : undefined;
  },

  async vote({ userId, contentId, contentType, voteType }) {
    const validVote = voteType === -1 ? -1 : 1;
    const previousVote = await this.getUserVote(userId, contentId, contentType);

    const targetTable = contentType === 'question' ? 'questions' : 'answers';
    let delta = 0;
    let finalVote = undefined;

    if (previousVote === validVote) {
      // Toggle off / remove vote
      await query(
        'DELETE FROM votes WHERE user_id = $1 AND content_id = $2 AND content_type = $3',
        [userId, contentId, contentType]
      );
      delta = -validVote;
      finalVote = undefined;
    } else if (previousVote !== undefined) {
      // Switching from 1 to -1 or -1 to 1
      await query(
        'UPDATE votes SET vote_type = $1 WHERE user_id = $2 AND content_id = $3 AND content_type = $4',
        [validVote, userId, contentId, contentType]
      );
      delta = validVote * 2;
      finalVote = validVote;
    } else {
      // Brand new vote
      await query(
        'INSERT INTO votes (user_id, content_id, content_type, vote_type) VALUES ($1, $2, $3, $4)',
        [userId, contentId, contentType, validVote]
      );
      delta = validVote;
      finalVote = validVote;
    }

    // Update the counter on the target question/answer
    const { rows } = await query(
      `UPDATE ${targetTable} SET upvotes = upvotes + $1 WHERE id = $2 RETURNING upvotes`,
      [delta, contentId]
    );

    const upvotes = rows.length ? rows[0].upvotes : 0;

    return {
      contentId,
      upvotes,
      myVote: finalVote,
    };
  },
};

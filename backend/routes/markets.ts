import { Router } from 'express';
import { MarketMeta } from '../models/MarketMeta';

const router = Router();

// Add or get metadata for a market
router.get('/:id/meta', async (req, res) => {
  try {
    const marketId = parseInt(req.params.id);
    let meta = await MarketMeta.findOne({ marketId });
    if (!meta) {
      // Default placeholder if none exists
      meta = await MarketMeta.create({
        marketId,
        category: 'Crypto',
        tags: ['Bitcoin', 'Finance'],
        aiConfidenceLabel: 'Moderate',
        aiProbabilityYes: 60,
        comments: []
      });
    }
    res.json(meta);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meta' });
  }
});

// Post a social comment
router.post('/:id/comments', async (req, res) => {
  try {
    const marketId = parseInt(req.params.id);
    const { userAddress, content, sentiment } = req.body;
    
    let meta = await MarketMeta.findOne({ marketId });
    if (!meta) {
      meta = await MarketMeta.create({ marketId });
    }

    meta.comments.push({ userAddress, content, sentiment, createdAt: new Date() });
    await meta.save();

    // Broadcast the new comment via websockets!
    const { io } = require('../server');
    io.to(`market_${marketId}`).emit('new_comment', meta.comments[meta.comments.length - 1]);

    res.json(meta);
  } catch (error) {
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

export default router;

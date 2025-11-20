import express from 'express';
// import fetch from 'node-fetch';
// import decodeJWT from '../utils/decodeJWT.js';
const whatsappRouter = express.Router();


function decodeJWT(token) {
  try {
    if (!token) {
      console.log('No token provided to decodeJWT');
      return null;
    }
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}
whatsappRouter.post('/webhook', async (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) {
      return res.status(400).json({ success: false, message: 'No message received' });
    }

    const voteId = message.text?.body?.trim();
    const voterPhone = message.from;

    if (!voteId || isNaN(parseInt(voteId))) {
      return res.status(400).json({ success: false, message: 'Invalid vote ID received' });
    }

    // Simulate token (replace with real logic if needed)
    const token = 'FAKE_JWT_FOR_TESTING';

    const decodedToken = decodeJWT(token);
    const myId = decodedToken?.id;

    if (!myId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
    }

    const voteData = {
      voter_id: myId,
      vote_type: 'employee',
      target_id: parseInt(voteId),
      comment: null,
      is_anonymous: 1,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    };

    const voteResponse = await fetch(`http://localhost:3001/api/employees/${voteId}/vote`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comment: voteData.comment })
    });

    const result = await voteResponse.json();

    res.json({ success: true, message: 'Vote cast via WhatsApp', result });
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error);
    res.status(500).json({ success: false, message: 'Failed to process WhatsApp vote' });
  }
});

export default whatsappRouter;

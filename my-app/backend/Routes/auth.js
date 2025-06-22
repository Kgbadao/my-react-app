// POST /auth/google — Handle One Tap Token
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload(); // Contains email, name, etc.
    const { email, name } = payload;

    // TODO: Find or create user in DB
    // const user = await User.findOrCreate({ email, name });

    // TODO: Log user in (e.g., req.login(user))
    // req.login(user, err => { if (err) throw err });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

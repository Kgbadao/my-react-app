import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    axios.get('/api/user/me', { withCredentials: true }).then(res => setUser(res.data));
  }, []);

  const save = async () => {
    await axios.put('/api/user/me', user, { withCredentials: true });
    setEditing(false);
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl mb-2">Profile</h2>
      <input className="input" value={user.name} onChange={e => setUser({ ...user, name: e.target.value })} disabled={!editing} />
      <input className="input mt-2" value={user.bio || ''} onChange={e => setUser({ ...user, bio: e.target.value })} disabled={!editing} />
      {editing ? (
        <button className="btn mt-4" onClick={save}>Save</button>
      ) : (
        <button className="btn mt-4" onClick={() => setEditing(true)}>Edit</button>
      )}
    </div>
  );
}

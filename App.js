import React, { useState } from 'react';
import Login from './Login';
import ChatRoom from './ChatRoom';

function App() {
  const [user, setUser] = useState(null);

  return user ? (
    <ChatRoom user={user} />
  ) : (
    <Login setUser={setUser} />
  );
}

export default App;

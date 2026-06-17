import { Suspense } from 'react';
import ChatPage from '../../home/ChatPage';

function ChatContent() {
  return <ChatPage />;
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}

import ChatPage from '../../home/ChatPage';
import RequireAuth from '../../components/RequireAuth';

export default function Page() {
  return (
    <RequireAuth requireVerified={true}>
      <ChatPage />
    </RequireAuth>
  );
}

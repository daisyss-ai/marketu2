import Profile from '../../home/Profile';
import RequireAuth from '../../components/RequireAuth';

export default function Page() {
  return (
    <RequireAuth requireVerified={true}>
      <Profile />
    </RequireAuth>
  );
}

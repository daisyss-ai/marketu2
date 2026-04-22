import Sell from '../../home/Sell';
import RequireAuth from '../../components/RequireAuth';

export default function Page() {
  return (
    <RequireAuth requireVerified={true}>
      <Sell />
    </RequireAuth>
  );
}

import { redirect } from 'next/navigation';

export default function GamePlayRedirect() {
  redirect('/admin/gameplay/dashboard');
}

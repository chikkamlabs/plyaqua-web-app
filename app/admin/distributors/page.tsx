import { redirect } from 'next/navigation';

export default function DistributorsRedirect() {
  redirect('/admin/distributors/dashboard');
}

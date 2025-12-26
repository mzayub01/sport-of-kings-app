import { redirect } from 'next/navigation';

// Redirect public /naseeha to dashboard naseeha (members only)
export default function NaseehaRedirect() {
    redirect('/dashboard/naseeha');
}

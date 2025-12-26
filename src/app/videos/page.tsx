import { redirect } from 'next/navigation';

// Redirect public /videos to dashboard videos (members only)
export default function VideosRedirect() {
    redirect('/dashboard/videos');
}

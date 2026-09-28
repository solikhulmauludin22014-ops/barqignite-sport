import { revalidatePath } from 'next/cache';

export function revalidatePublicStats() {
  revalidatePath('/');
}
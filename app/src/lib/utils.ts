import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function handleUpgradePlan(user: any, tenant: any) {
  const email = 'nineorbite@gmail.com';
  const subject = 'PLAN UPGRADATION';
  const body = `Hello Orbix Team,

I would like to upgrade my current plan.

Details:
Name: ${user?.fullName || 'N/A'}
User Email: ${user?.email || 'N/A'}
Showroom Name: ${tenant?.name || 'N/A'}
Current Plan: ${tenant?.plan || 'N/A'}

Please get in touch with me to discuss the upgrade.

Thanks,
${user?.fullName || 'N/A'}`;

  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

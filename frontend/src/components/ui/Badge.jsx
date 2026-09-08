import clsx from 'clsx';

const variants = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-800',
  purple: 'bg-purple-100 text-purple-800',
  orange: 'bg-orange-100 text-orange-800',
};

export default function Badge({ children, variant = 'gray', className = '' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    pending: { label: 'Pending', variant: 'yellow' },
    approved: { label: 'Approved', variant: 'green' },
    rejected: { label: 'Rejected', variant: 'red' },
    active: { label: 'Active', variant: 'green' },
    inactive: { label: 'Inactive', variant: 'gray' },
    open: { label: 'Open', variant: 'blue' },
    closed: { label: 'Closed', variant: 'gray' },
    draft: { label: 'Draft', variant: 'gray' },
    pending_approval: { label: 'Pending Approval', variant: 'yellow' },
    shortlisted: { label: 'Shortlisted', variant: 'green' },
    hired: { label: 'Hired', variant: 'purple' },
    present: { label: 'Present', variant: 'green' },
    absent: { label: 'Absent', variant: 'red' },
    on_leave: { label: 'On Leave', variant: 'blue' },
    submitted: { label: 'Submitted', variant: 'blue' },
    acknowledged: { label: 'Acknowledged', variant: 'yellow' },
    accepted: { label: 'Accepted', variant: 'green' },
    completed: { label: 'Completed', variant: 'green' },
    in_progress: { label: 'In Progress', variant: 'blue' },
    new: { label: 'New', variant: 'blue' },
  };

  const config = map[status] || { label: status, variant: 'gray' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

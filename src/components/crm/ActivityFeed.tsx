'use client';

interface Activity {
  id: string;
  type: string;
  title: string;
  body: string | null;
  created_at: string;
  contact_name?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const typeIcons: Record<string, string> = {
  call: '\uD83D\uDCDE',
  email: '\u2709\uFE0F',
  note: '\uD83D\uDCDD',
  meeting: '\uD83D\uDCC5',
  task: '\u2705',
  enrichment: '\uD83D\uDD0D',
  aria_alert: '\u26A1',
};

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const items = activities.slice(0, 8);

  return (
    <div
      style={{
        backgroundColor: '#0F1019',
        border: '1px solid #1E2035',
        borderRadius: 12,
        padding: 24,
      }}
    >
      <h3 style={{ color: '#F1F3FA', fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
        Recent Activity
      </h3>

      <div className="flex flex-col">
        {items.map((activity, index) => (
          <div key={activity.id}>
            <div className="flex items-start gap-3 py-3">
              <span style={{ fontSize: 18, lineHeight: 1 }}>
                {typeIcons[activity.type] || '\uD83D\uDCCC'}
              </span>
              <div className="flex flex-col gap-0.5" style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center justify-between gap-2">
                  <span
                    style={{
                      color: '#F1F3FA',
                      fontSize: 13,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {activity.title}
                  </span>
                  <span
                    style={{
                      color: '#6B7299',
                      fontSize: 11,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {getRelativeTime(activity.created_at)}
                  </span>
                </div>
                {activity.contact_name && (
                  <span style={{ color: '#6B7299', fontSize: 12 }}>
                    {activity.contact_name}
                  </span>
                )}
              </div>
            </div>
            {index < items.length - 1 && (
              <div style={{ height: 1, backgroundColor: '#1E2035' }} />
            )}
          </div>
        ))}

        {items.length === 0 && (
          <p style={{ color: '#6B7299', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            No recent activity
          </p>
        )}
      </div>
    </div>
  );
}

'use client';

interface DashboardBriefProps {
  brief: string;
  loading: boolean;
}

export default function DashboardBrief({ brief, loading }: DashboardBriefProps) {
  return (
    <>
      <style>{`
        @keyframes ariaPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>

      {/* Outer wrapper with gradient border */}
      <div
        style={{
          background: 'linear-gradient(135deg, #8B5CF6, #22D3EE)',
          borderRadius: 16,
          padding: 1,
          width: '100%',
        }}
      >
        {/* Inner card */}
        <div
          className="flex items-start gap-4 p-5"
          style={{
            backgroundColor: '#0D0E1A',
            borderRadius: 15,
          }}
        >
          {/* Pulsing orb */}
          <div
            style={{
              width: 16,
              height: 16,
              minWidth: 16,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8B5CF6, #22D3EE)',
              animation: 'ariaPulse 2s ease-in-out infinite',
              marginTop: 3,
            }}
          />

          <div className="flex flex-col gap-1" style={{ flex: 1 }}>
            {loading ? (
              <>
                <div
                  style={{
                    height: 16,
                    width: '60%',
                    borderRadius: 8,
                    backgroundColor: '#1E2035',
                    animation: 'skeletonPulse 1.5s ease-in-out infinite',
                  }}
                />
                <div
                  style={{
                    height: 14,
                    width: '80%',
                    borderRadius: 8,
                    backgroundColor: '#1E2035',
                    animation: 'skeletonPulse 1.5s ease-in-out infinite',
                    animationDelay: '0.2s',
                    marginTop: 6,
                  }}
                />
                <span style={{ color: '#6B7299', fontSize: 12, marginTop: 8 }}>
                  ARIA is analysing your pipeline...
                </span>
              </>
            ) : (
              <>
                <p style={{ color: '#F1F3FA', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                  <span
                    style={{
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #8B5CF6, #22D3EE)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      marginRight: 6,
                    }}
                  >
                    ARIA
                  </span>
                  {brief}
                </p>
                <span style={{ color: '#6B7299', fontSize: 12, marginTop: 4 }}>
                  Powered by ARIA Intelligence
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

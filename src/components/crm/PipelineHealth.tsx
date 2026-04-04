'use client';

interface Stage {
  name: string;
  value: number;
  color: string;
  count: number;
}

interface PipelineHealthProps {
  stages: Stage[];
}

const formatCurrency = (value: number) => {
  return '£' + value.toLocaleString('en-GB');
};

export default function PipelineHealth({ stages }: PipelineHealthProps) {
  const maxValue = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div
      style={{
        backgroundColor: '#0F1019',
        border: '1px solid #1E2035',
        borderRadius: 12,
        padding: 24,
      }}
    >
      <h3 style={{ color: '#F1F3FA', fontSize: 16, fontWeight: 600, margin: '0 0 20px' }}>
        Pipeline Health
      </h3>

      <div className="flex flex-col gap-4">
        {stages.map((stage) => {
          const widthPercent = (stage.value / maxValue) * 100;
          return (
            <div key={stage.name} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span style={{ color: '#F1F3FA', fontSize: 13, fontWeight: 500 }}>
                  {stage.name}
                </span>
                <div className="flex items-center gap-3">
                  <span style={{ color: '#6B7299', fontSize: 12 }}>
                    {stage.count} deals
                  </span>
                  <span style={{ color: '#F1F3FA', fontSize: 13, fontWeight: 600 }}>
                    {formatCurrency(stage.value)}
                  </span>
                </div>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#1E2035',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${widthPercent}%`,
                    borderRadius: 4,
                    backgroundColor: stage.color,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}



interface StatCardProps {
  title: string;
  value: string | number;
  trendValue?: string;
  trendUp?: boolean;
  icon: React.ReactNode;
  iconColorClass?: 'primary' | 'blue' | 'purple' | 'yellow';
}

export function StatCard({ title, value, trendValue, trendUp, icon, iconColorClass = 'primary' }: StatCardProps) {
  return (
    <div className="analytics-card glass-panel">
      <div className="card-header-spark">
        <div className={`card-icon-container ${iconColorClass}`}>
          {icon}
        </div>
        {trendValue && (
          <div className={`card-trend ${trendUp ? 'up' : 'down'}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              {trendUp ? (
                <polyline points="18 15 12 9 6 15" />
              ) : (
                <polyline points="6 9 12 15 18 9" />
              )}
            </svg>
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className="card-body-spark">
        <div className="card-info">
          <span>{title}</span>
          <h2>{value}</h2>
        </div>
        <div className="sparkline-container">
          <svg viewBox="0 0 100 45" width="100%" height="100%">
            <defs>
              <linearGradient id={`grad-${trendUp ? 'green' : 'red'}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={trendUp ? '#22C55E' : '#EF4444'} stopOpacity="0.3"/>
                <stop offset="100%" stopColor={trendUp ? '#22C55E' : '#EF4444'} stopOpacity="0.0"/>
              </linearGradient>
            </defs>
            <path 
              d={trendUp ? "M 0 35 Q 20 20 40 28 T 80 10 T 100 5 L 100 45 L 0 45 Z" : "M 0 10 Q 20 28 40 15 T 80 32 T 100 38 L 100 45 L 0 45 Z"} 
              fill={`url(#grad-${trendUp ? 'green' : 'red'})`}
            />
            <path 
              d={trendUp ? "M 0 35 Q 20 20 40 28 T 80 10 T 100 5" : "M 0 10 Q 20 28 40 15 T 80 32 T 100 38"} 
              fill="none" 
              stroke={trendUp ? '#22C55E' : '#EF4444'} 
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

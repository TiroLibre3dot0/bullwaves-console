export default function StickyMetricsTable({
  children,
  className = 'table',
  tableStyle,
  maxHeight = '70vh',
  containerStyle,
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div
        className="scroll-container"
        style={{
          maxHeight,
          overflowY: 'auto',
          overflowX: 'auto',
          borderRadius: 16,
          ...(containerStyle || null),
        }}
      >
        <table
          className={`${className} sticky-metrics-table`}
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            ...(tableStyle || null),
          }}
        >
          {children}
        </table>
      </div>
    </div>
  )
}

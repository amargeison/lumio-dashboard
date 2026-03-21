export default function DfeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      backgroundColor: '#07080F',
      overflowY: 'auto',
    }}>
      {children}
    </div>
  )
}

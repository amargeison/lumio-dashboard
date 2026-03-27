export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#07080F', minHeight: '100vh' }}>
      {children}
    </div>
  )
}

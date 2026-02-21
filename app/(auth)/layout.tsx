export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-8">
      {children}
    </div>
  )
}

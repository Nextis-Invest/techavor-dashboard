import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectChat } from "@/components/messaging/ProjectChat"
import { getCurrentUser } from "@/lib/auth/session"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function IntakeDetailPage({ params }: { params: { id: string } }) {
  const [intake, user] = await Promise.all([
    prisma.clientIntake.findUnique({ where: { id: params.id } }),
    getCurrentUser()
  ])

  if (!intake || !user) notFound()

  const clientName = intake.isCompany && intake.companyName
    ? intake.companyName
    : `${intake.firstName} ${intake.lastName}`

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/intakes" className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <h2 className="text-2xl font-bold">{clientName}</h2>
        <Badge variant={intake.status === "PAID" ? "default" : "secondary"}>
          {intake.status === "PAID" ? "Payé" : "En attente"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Informations client</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Email :</span> <span className="font-medium">{intake.email}</span></div>
            {intake.phone && <div><span className="text-muted-foreground">Tél :</span> <span className="font-medium">{intake.phone}</span></div>}
            {intake.siren && <div><span className="text-muted-foreground">SIREN :</span> <span className="font-medium">{intake.siren}</span></div>}
            {intake.linkedin && <div><span className="text-muted-foreground">LinkedIn :</span> <a href={intake.linkedin} className="text-primary hover:underline" target="_blank">{intake.linkedin}</a></div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Projet</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Plan :</span> <span className="font-medium">{intake.planName ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Niche :</span> <span className="font-medium">{intake.niche ?? "—"}</span></div>
            {intake.currentWebsite && <div><span className="text-muted-foreground">Site actuel :</span> <a href={intake.currentWebsite} className="text-primary hover:underline" target="_blank">{intake.currentWebsite}</a></div>}
            {intake.invoiceNumber && <div><span className="text-muted-foreground">Facture :</span> <a href={`https://techavor.com/api/invoice/${intake.id}`} className="text-primary hover:underline" target="_blank">{intake.invoiceNumber}</a></div>}
          </CardContent>
        </Card>
      </div>

      {intake.projectDescription && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Description du projet</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{intake.projectDescription}</p>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">💬 Conversation</h3>
        <ProjectChat
          intakeId={intake.id}
          currentUserEmail={user.email!}
          currentUserName="Équipe Techavor"
          senderType="ADMIN"
          placeholder="Répondre au client..."
        />
      </div>
    </div>
  )
}

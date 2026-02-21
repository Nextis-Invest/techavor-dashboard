import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function MyProjectPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  // Find intake by email
  const intake = await prisma.clientIntake.findFirst({
    where: { email: user.email! },
    orderBy: { createdAt: "desc" },
  })

  if (!intake) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold mb-4">Bienvenue chez Techavor</h1>
        <p className="text-muted-foreground">
          Votre projet sera bientot visible ici.
        </p>
      </div>
    )
  }

  const clientName =
    intake.isCompany && intake.companyName
      ? intake.companyName
      : `${intake.firstName} ${intake.lastName}`

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mon projet</h1>
        <p className="text-muted-foreground mt-1">
          Bonjour {intake.firstName}, voici le brief de votre projet.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{intake.planName ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Statut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={intake.status === "PAID" ? "default" : "secondary"}>
              {intake.status === "PAID" ? "Paye" : "En attente"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{clientName}</p>
          </CardContent>
        </Card>
      </div>

      {intake.projectDescription && (
        <Card>
          <CardHeader>
            <CardTitle>Description du projet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {intake.projectDescription}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {intake.niche && (
            <div>
              <span className="text-muted-foreground">Secteur : </span>
              <span className="font-medium">{intake.niche}</span>
            </div>
          )}
          {intake.currentWebsite && (
            <div>
              <span className="text-muted-foreground">Site actuel : </span>
              <a
                href={intake.currentWebsite}
                target="_blank"
                className="font-medium text-primary hover:underline"
              >
                {intake.currentWebsite}
              </a>
            </div>
          )}
          {intake.linkedin && (
            <div>
              <span className="text-muted-foreground">LinkedIn : </span>
              <a
                href={intake.linkedin}
                target="_blank"
                className="font-medium text-primary hover:underline"
              >
                {intake.linkedin}
              </a>
            </div>
          )}
          {intake.phone && (
            <div>
              <span className="text-muted-foreground">Telephone : </span>
              <span className="font-medium">{intake.phone}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          Une question ?{" "}
          <a
            href="mailto:hello@techavor.com"
            className="text-primary hover:underline"
          >
            hello@techavor.com
          </a>
        </p>
      </div>
    </div>
  )
}

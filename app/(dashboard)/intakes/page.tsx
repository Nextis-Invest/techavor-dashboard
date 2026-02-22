import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function IntakesPage() {
  const intakes = await prisma.clientIntake.findMany({
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Projets clients</h2>
        <Badge variant="outline">{intakes.length} projets</Badge>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>SIREN</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Niche</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Facture</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {intakes.map((intake) => (
                <TableRow key={intake.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(intake.createdAt).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {intake.isCompany && intake.companyName
                      ? intake.companyName
                      : `${intake.firstName} ${intake.lastName}`}
                  </TableCell>
                  <TableCell>{intake.email}</TableCell>
                  <TableCell>{intake.siren ?? "—"}</TableCell>
                  <TableCell>{intake.planName ?? "-"}</TableCell>
                  <TableCell className="text-sm">{intake.niche ?? "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {intake.projectDescription
                      ? intake.projectDescription.slice(0, 80) +
                        (intake.projectDescription.length > 80 ? "..." : "")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        intake.status === "PAID" ? "default"
                        : intake.status === "DRAFT" ? "outline"
                        : "secondary"
                      }
                    >
                      {intake.status === "PAID" ? "Payé"
                        : intake.status === "DRAFT" ? "Brouillon"
                        : "En attente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {intake.status === "PAID" ? (
                      <a
                        href={"https://techavor.com/api/invoice/" + intake.id}
                        target="_blank"
                        className="text-primary hover:underline text-xs"
                      >
                        Télécharger
                      </a>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <Link href={`/intakes/${intake.id}`} className="text-primary hover:underline text-xs font-medium">
                      Ouvrir →
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {intakes.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center text-muted-foreground py-8"
                  >
                    Aucun projet pour linstant.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

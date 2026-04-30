import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

const INGEST_SECRET = process.env.LEAD_INGEST_SECRET;

const LeadSchema = z.object({
  site: z.enum(["SPP_FR", "SPP_MA", "SPP_COM", "SPP_CH"]).default("SPP_FR"),
  projectType: z.enum(["CONSTRUCTION", "MAINTENANCE"]),
  numCourts: z.number().int().min(1).max(99).optional(),
  courtType: z.enum(["INDOOR", "OUTDOOR", "SEMI_COVERED"]).optional(),
  options: z.array(z.string()).default([]),
  personType: z.enum(["PARTICULIER", "PROFESSIONNEL"]).default("PARTICULIER"),
  companyName: z.string().optional(),
  siret: z.string().optional(),
  siren: z.string().optional(),
  companyAddress: z.string().optional(),
  companyCity: z.string().optional(),
  companyPostcode: z.string().optional(),
  dirigeant: z.string().optional(),
  country: z.string().default("FR"),
  projectAddress: z.string().optional(),
  projectCity: z.string().optional(),
  projectPostcode: z.string().optional(),
  sameAsCompany: z.boolean().default(false),
  name: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

function verifySignature(payload: string, signature: string | null): boolean {
  if (!INGEST_SECRET || !signature) return false;
  const expected = crypto
    .createHmac("sha256", INGEST_SECRET)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expected}`)
  );
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-webhook-signature");
    const body = await req.text();

    // Verify webhook signature
    if (!verifySignature(body, signature)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const data = JSON.parse(body);
    const parsed = LeadSchema.safeParse(data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.create({
      data: parsed.data,
    });

    return NextResponse.json({ success: true, id: lead.id }, { status: 201 });
  } catch (error) {
    console.error("Lead ingest error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

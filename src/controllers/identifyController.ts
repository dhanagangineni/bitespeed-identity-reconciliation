import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const identifyContact = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({ error: "Email or phoneNumber required" });
    }

    // 1️⃣ Find matching contacts
    const matchedContacts = await prisma.contact.findMany({
      where: {
        OR: [
          email ? { email } : undefined,
          phoneNumber ? { phoneNumber } : undefined,
        ].filter(Boolean) as any,
      },
      orderBy: { createdAt: "asc" },
    });

    // ===============================
    // CASE A — No contact exists
    // ===============================
    if (matchedContacts.length === 0) {
      const newPrimary = await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: "primary",
        },
      });

      return res.status(200).json({
        contact: {
          primaryContatctId: newPrimary.id,
          emails: email ? [email] : [],
          phoneNumbers: phoneNumber ? [phoneNumber] : [],
          secondaryContactIds: [],
        },
      });
    }

    // ===============================
    // 2️⃣ Get all related contacts
    // ===============================
    const primaryIds = new Set<number>();

    matchedContacts.forEach((c) => {
      if (c.linkPrecedence === "primary") primaryIds.add(c.id);
      if (c.linkedId) primaryIds.add(c.linkedId);
    });

    const allContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { id: { in: Array.from(primaryIds) } },
          { linkedId: { in: Array.from(primaryIds) } },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    // ===============================
    // 3️⃣ Find oldest primary
    // ===============================
    const primaries = allContacts.filter(
      (c) => c.linkPrecedence === "primary"
    );

    const oldestPrimary = primaries.reduce((oldest, current) =>
      current.createdAt < oldest.createdAt ? current : oldest
    );

    const primaryId = oldestPrimary.id;

    // ===============================
    // 4️⃣ Convert other primaries
    // ===============================
    const otherPrimaries = primaries.filter((p) => p.id !== primaryId);

    for (const p of otherPrimaries) {
      await prisma.contact.update({
        where: { id: p.id },
        data: {
          linkPrecedence: "secondary",
          linkedId: primaryId,
        },
      });
    }

    // ===============================
    // 5️⃣ Refresh full cluster
    // ===============================
    const finalCluster = await prisma.contact.findMany({
      where: {
        OR: [{ id: primaryId }, { linkedId: primaryId }],
      },
      orderBy: { createdAt: "asc" },
    });

    // ===============================
    // 6️⃣ Check if new info needed
    // ===============================
    const emailSet = new Set(
      finalCluster.map((c) => c.email).filter(Boolean)
    );
    const phoneSet = new Set(
      finalCluster.map((c) => c.phoneNumber).filter(Boolean)
    );

    const isNewEmail = email && !emailSet.has(email);
    const isNewPhone = phoneNumber && !phoneSet.has(phoneNumber);

    if (isNewEmail || isNewPhone) {
      await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkedId: primaryId,
          linkPrecedence: "secondary",
        },
      });
    }

    // ===============================
    // 7️⃣ Final fetch
    // ===============================
    const finalContacts = await prisma.contact.findMany({
      where: {
        OR: [{ id: primaryId }, { linkedId: primaryId }],
      },
      orderBy: { createdAt: "asc" },
    });

    const primaryContact = finalContacts.find(
      (c) => c.linkPrecedence === "primary"
    )!;

    const secondaryIds = finalContacts
      .filter((c) => c.linkPrecedence === "secondary")
      .map((c) => c.id);

    const emails = [
      ...new Set(finalContacts.map((c) => c.email).filter(Boolean)),
    ];

    const phones = [
      ...new Set(finalContacts.map((c) => c.phoneNumber).filter(Boolean)),
    ];

    return res.status(200).json({
      contact: {
        primaryContatctId: primaryContact.id,
        emails,
        phoneNumbers: phones,
        secondaryContactIds: secondaryIds,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
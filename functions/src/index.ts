import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export the createUserDocument function
export { createUserDocument } from "./create-user-on-signup";

// Audit log function - automatically logs all changes
export const onWriteAuditLog = functions.firestore
  .document("{collection}/{documentId}")
  .onWrite(async (change, context) => {
    const collection = context.params.collection;
    const documentId = context.params.documentId;

    // Skip audit logs collection to avoid infinite loops
    if (collection === "auditLogs") {
      return null;
    }

    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.exists ? change.after.data() : null;

    // Determine action type
    let action = "update";
    if (!beforeData && afterData) {
      action = "create";
    } else if (beforeData && !afterData) {
      action = "delete";
    }

    // Get user info from context (if available)
    const userId = context.auth?.uid || "system";
    const userEmail =
      (context.auth?.token as { email?: string })?.email || "system";

    // Calculate changes
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    if (beforeData && afterData) {
      Object.keys(afterData).forEach((key) => {
        if (
          JSON.stringify(beforeData[key]) !== JSON.stringify(afterData[key])
        ) {
          changes[key] = {
            old: beforeData[key],
            new: afterData[key],
          };
        }
      });
    }

    // Create audit log
    await admin
      .firestore()
      .collection("auditLogs")
      .add({
        userId,
        userEmail,
        action,
        resourceType: collection,
        resourceId: documentId,
        changes: Object.keys(changes).length > 0 ? changes : undefined,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

    return null;
  });

// Send notification when donation is received
export const onDonationCreated = functions.firestore
  .document("donations/{donationId}")
  .onCreate(async (snap) => {
    const donation = snap.data();

    // Update donor's total donations
    if (donation.donorId) {
      const donorRef = admin.firestore().doc(`donors/${donation.donorId}`);
      await donorRef.update({
        totalDonations: admin.firestore.FieldValue.increment(donation.amount),
        lastDonationDate: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Send notification to finance team
    // In a real implementation, you would send email/push notifications here

    return null;
  });

// Generate monthly report
export const generateMonthlyReport = functions.pubsub
  .schedule("0 0 1 * *") // First day of every month at midnight
  .timeZone("Africa/Lagos")
  .onRun(async () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get donations from last month
    const donationsSnapshot = await admin
      .firestore()
      .collection("donations")
      .where("donationDate", ">=", lastMonth)
      .where("donationDate", "<", thisMonth)
      .get();

    const totalDonations = donationsSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().amount || 0),
      0
    );

    // Create report document
    await admin
      .firestore()
      .collection("reports")
      .add({
        type: "monthly",
        period: {
          start: lastMonth,
          end: thisMonth,
        },
        totalDonations,
        donationCount: donationsSnapshot.size,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return null;
  });

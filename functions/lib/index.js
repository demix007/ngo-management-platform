"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMonthlyReport = exports.onDonationCreated = exports.onWriteAuditLog = exports.createUserDocument = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
    admin.initializeApp();
}
// Export the createUserDocument function
var create_user_on_signup_1 = require("./create-user-on-signup");
Object.defineProperty(exports, "createUserDocument", { enumerable: true, get: function () { return create_user_on_signup_1.createUserDocument; } });
// Audit log function - automatically logs all changes
exports.onWriteAuditLog = functions.firestore
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
    }
    else if (beforeData && !afterData) {
        action = "delete";
    }
    // Get user info from context (if available)
    const userId = context.auth?.uid || "system";
    const userEmail = context.auth?.token?.email || "system";
    // Calculate changes
    const changes = {};
    if (beforeData && afterData) {
        Object.keys(afterData).forEach((key) => {
            if (JSON.stringify(beforeData[key]) !== JSON.stringify(afterData[key])) {
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
exports.onDonationCreated = functions.firestore
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
exports.generateMonthlyReport = functions.pubsub
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
    const totalDonations = donationsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
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
//# sourceMappingURL=index.js.map
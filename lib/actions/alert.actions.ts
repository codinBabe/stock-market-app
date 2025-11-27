"use server";

import { connectDB } from "@/database/mongoose";
import { auth } from "@/lib/better-auth/auth";
import { ObjectId } from "mongodb";
import { headers } from "next/headers";

// Create a new alert for the authenticated user
export const createAlert = async (data: {
  symbol: string;
  company: string;
  alertName: string;
  alertType: "upper" | "lower" | "cross";
  frequency: "1m" | "1h" | "1d";
  threshold: number;
  lastTriggered: Date | null;
}) => {
  try {
    const {
      symbol,
      company,
      alertName,
      alertType,
      frequency,
      threshold,
      lastTriggered,
    } = data || {};
    if (
      !symbol ||
      !company ||
      !alertName ||
      !alertType ||
      !frequency ||
      threshold == null
    ) {
      throw new Error("Missing required fields");
    }

    const session = await auth.api.getSession({ headers: await headers() });
    const email = session?.user?.email;
    if (!email) throw new Error("Not authenticated");

    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not found");

    const user = await db
      .collection("user")
      .findOne<{ id: string; _id: unknown; email: string }>({ email });
    if (!user) throw new Error("User not found");

    const userid = (user.id as string) || String(user._id?.toString() || "");
    if (!userid) throw new Error("User id not found");

    const created = await db.collection("alerts").insertOne({
      userid,
      symbol: symbol.toUpperCase(),
      company,
      alertName,
      alertType,
      frequency,
      threshold,
      createdAt: new Date(),
      lastTriggered,
    });

    return { success: true, id: String(created.insertedId) };
  } catch (e) {
    console.error("Failed to create alert", e);
    return { success: false, error: "Failed to create alert" } as const;
  }
};

// Get alerts for the authenticated user
export const getMyAlerts = async (): Promise<
  {
    id: string;
    symbol: string;
    company: string;
    alertName: string;
    alertType: "upper" | "lower" | "cross";
    frequency: "1m" | "1h" | "1d";
    threshold: number;
    lastTriggered: Date | null;
  }[]
> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const email = session?.user?.email;
    if (!email) return [];

    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not found");

    const user = await db
      .collection("user")
      .findOne<{ id: string; _id: unknown; email: string }>({ email });
    if (!user) return [];

    const userid = (user.id as string) || String(user._id?.toString() || "");
    if (!userid) return [];

    const items = await db
      .collection("alerts")
      .find(
        { userid },
        {
          projection: {
            _id: 1,
            symbol: 1,
            company: 1,
            alertName: 1,
            alertType: 1,
            frequency: 1,
            threshold: 1,
            lastTriggered: 1,
          },
        }
      )
      .sort({ createdAt: -1 })
      .toArray();

    return (items || []).map((i: any) => ({
      id: String(i._id),
      symbol: String(i.symbol),
      company: String(i.company),
      alertName: String(i.alertName),
      alertType: i.alertType,
      frequency: i.frequency,
      threshold: Number(i.threshold),
      lastTriggered: i.lastTriggered || null,
    }));
  } catch (e) {
    console.error("Failed to get my alerts", e);
    return [];
  }
};

export async function fetchAllAlerts() {
  const mongoose = await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database connection not found");

  const items = await db
    .collection("alerts")
    .find(
      {},
      {
        projection: {
          _id: 1,
          userid: 1,
          symbol: 1,
          company: 1,
          alertName: 1,
          alertType: 1,
          frequency: 1,
          threshold: 1,
          lastTriggered: 1,
        },
      }
    )
    .toArray();

  return items.map((i: any) => ({
    id: String(i._id),
    userid: String(i.userid),
    symbol: i.symbol,
    company: i.company,
    alertName: i.alertName,
    alertType: i.alertType,
    frequency: i.frequency,
    threshold: Number(i.threshold),
    lastTriggered: i.lastTriggered || null,
  }));
}

// Delete an alert by ID for the authenticated user
export const deleteAlert = async (alertId: string) => {
  try {
    if (!alertId) throw new Error("Alert ID is required");

    const session = await auth.api.getSession({ headers: await headers() });
    const email = session?.user?.email;
    if (!email) throw new Error("Not authenticated");

    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not found");

    const user = await db
      .collection("user")
      .findOne<{ id: string; _id: unknown; email: string }>({ email });

    if (!user) throw new Error("User not found");
    const userid = (user.id as string) || String(user._id?.toString() || "");
    if (!userid) throw new Error("User id not found");

    const result = await db
      .collection("alerts")
      .deleteOne({ _id: new ObjectId(alertId), userid });
    return result.deletedCount === 1;
  } catch (e) {
    console.error("Failed to delete alert", e);
    return false;
  }
};

// Update an alert by ID for the authenticated user
export const updateAlert = async (
  alertId: string,
  data: {
    symbol: string;
    company: string;
    alertName: string;
    alertType: "upper" | "lower" | "cross";
    frequency: "1m" | "1h" | "1d";
    threshold: number;
  }
) => {
  try {
    if (!alertId) throw new Error("Alert ID is required");

    const { symbol, company, alertName, alertType, frequency, threshold } =
      data || {};
    if (
      !symbol ||
      !company ||
      !alertName ||
      !alertType ||
      !frequency ||
      threshold == null
    ) {
      throw new Error("Missing required fields");
    }

    const session = await auth.api.getSession({ headers: await headers() });
    const email = session?.user?.email;
    if (!email) throw new Error("Not authenticated");

    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not found");

    const user = await db
      .collection("user")
      .findOne<{ id: string; _id: unknown; email: string }>({ email });

    if (!user) throw new Error("User not found");
    const userid = (user.id as string) || String(user._id?.toString() || "");
    if (!userid) throw new Error("User id not found");

    const result = await db.collection("alerts").updateOne(
      { _id: new ObjectId(alertId), userid },
      {
        $set: {
          symbol: symbol.toUpperCase(),
          company,
          alertName,
          alertType,
          frequency,
          threshold,
        },
      }
    );

    return result.matchedCount === 1;
  } catch (e) {
    console.error("Failed to update alert", e);
    return false;
  }
};

export const updateAlertTriggered = async (
  alertId: string,
  lastTriggered: Date
) => {
  const mongoose = await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not found");

  await db
    .collection("alerts")
    .updateOne({ _id: new ObjectId(alertId) }, { $set: { lastTriggered } });

  return true;
};

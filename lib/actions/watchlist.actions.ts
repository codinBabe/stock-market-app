"use server";

import { connectDB } from "@/database/mongoose";
import Watchlist from "@/database/models/watchlist.model";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export const getWatchlistSymbolsByEmail = async (
  email: string
): Promise<string[]> => {
  try {
    const mongoose = await connectDB();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not found");
    }

    const user = await db
      .collection("user")
      .findOne<{ id: string; _id: unknown; email: string }>({ email });
    if (!user) return [];

    const userid = (user.id as string) || String(user._id?.toString() || "");
    if (!userid) return [];

    const items = await Watchlist.find({ userid }, { symbol: 1 }).lean();

    return items.map((i) => String(i.symbol));
  } catch (e) {
    console.error("Failed to get watchlist symbols by email", e);
    return [];
  }
};

export const addToWatchlist = async (symbol: string, company: string) => {
  try {
    if (!symbol || !company) throw new Error("Missing symbol/company");

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

    await Watchlist.updateOne(
      { userid, symbol: symbol.toUpperCase() },
      { 
        $set: { company, symbol: symbol.toUpperCase() },
        $setOnInsert: { addedAt: new Date() }
      },
      { upsert: true }
    );

    revalidatePath("/watchlist");

    return { success: true } as const;
  } catch (e) {
    console.error("Failed to add to watchlist", e);
    return { success: false, error: "Failed to add to watchlist" } as const;
  }
};

export const removeFromWatchlist = async (symbol: string) => {
  try {
    if (!symbol) throw new Error("Missing symbol");

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

    await Watchlist.deleteOne({ userid, symbol: symbol.toUpperCase() });

    revalidatePath("/watchlist");
    return { success: true } as const;
  } catch (e) {
    console.error("Failed to remove from watchlist", e);
    return {
      success: false,
      error: "Failed to remove from watchlist",
    } as const;
  }
};

export const getMyWatchlist = async (): Promise<
  { symbol: string; company: string; addedAt: Date }[]
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

    const items = await Watchlist.find(
      { userid },
      { symbol: 1, company: 1, addedAt: 1, _id: 0 }
    )
      .sort({ addedAt: -1 })
      .lean();

    return (items || []).map((i) => ({
      symbol: String(i.symbol),
      company: String(i.company),
      addedAt: i.addedAt as Date,
    }));
  } catch (e) {
    console.error("Failed to get my watchlist", e);
    return [];
  }
};

export async function toggleWatchlistAction(
  symbol: string,
  company: string,
  next: boolean
) {
  if (next) {
    await addToWatchlist(symbol, company);
  } else {
    await removeFromWatchlist(symbol);
  }

  revalidatePath("/watchlist");
}

import mongoose, { Document, Model, model, models, Schema } from "mongoose";

export interface AlertItem extends Document {
  userid: string;
  symbol: string;
  company: string;
  alertName: string;
  alertType: "upper" | "lower" | "cross";
  threshold: number;
  frequency: "1m" | "1h" | "1d";
  lastTriggered: Date | null;
  createdAt: Date;
}

const AlertSchema = new Schema<AlertItem>(
  {
    userid: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    company: { type: String, required: true, trim: true },
    alertName: { type: String, required: true, trim: true },
    alertType: {
      type: String,
      enum: ["upper", "lower", "cross"],
      required: true,
    },
    frequency: {
      type: String,
      enum: ["1m", "1h", "1d"],
      required: true,
    },
    threshold: { type: Number, required: true },
    lastTriggered: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const Alerts: Model<AlertItem> =
  (models && (models as any).Alerts) || model<AlertItem>("Alerts", AlertSchema);

export default Alerts;
